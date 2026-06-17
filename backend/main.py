import os
import uuid
import shutil
import json
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from processor import SignWaveProcessor
from database import get_db, SessionLocal, Job as DBJob


app = FastAPI(title="SignWave AI Backend")
processor = SignWaveProcessor()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage directories
UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Pydantic Schemas


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------



# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"message": "SignWave AI API is running"}

# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------






# ---------------------------------------------------------------------------
# Job Endpoints (all require auth)
# ---------------------------------------------------------------------------

@app.get("/jobs", response_model=List[dict])
async def list_jobs(
    db: Session = Depends(get_db)
):
    return [
        {
            "id": j.id,
            "status": j.status,
            "progress": j.progress,
            "date": j.created_at.strftime("%Y-%m-%d"),
            "video_url": j.video_url,
        }
        for j in db.query(DBJob).all()
    ]


@app.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    job_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}{file_extension}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_job = DBJob(
        id=job_id,
        status="queued",
        progress=0,
        owner_id=None,
        video_url=f"http://localhost:8000/files/{job_id}{file_extension}",
    )
    db.add(new_job)
    db.commit()

    background_tasks.add_task(process_video, job_id, file_path)
    return {"job_id": job_id}


@app.get("/job/{job_id}")
async def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job.id,
        "status": job.status,
        "progress": job.progress,
        "transcript": job.transcript,
        "captions": job.captions,
        "video_url": job.video_url,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }


@app.get("/files/{file_id}")
async def get_file(file_id: str):
    # Try with the file_id as-is (may already include extension)
    if "." in file_id:
        path = os.path.join(UPLOAD_DIR, file_id)
        if os.path.exists(path):
            return FileResponse(path)
    else:
        for ext in [".mp4", ".mp3", ".mkv", ".mov", ".webm"]:
            path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
            if os.path.exists(path):
                return FileResponse(path)
    raise HTTPException(status_code=404, detail="File not found")


# ---------------------------------------------------------------------------
# Export Endpoint — generates a downloadable .srt caption file
# ---------------------------------------------------------------------------

def _seconds_to_srt_time(seconds: float) -> str:
    """Convert float seconds to SRT timestamp format HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


@app.get("/export/{job_id}")
async def export_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job is not yet completed")
    if not job.captions:
        raise HTTPException(status_code=400, detail="No captions available for this job")

    # Build SRT content
    srt_lines: List[str] = []
    captions = job.captions if isinstance(job.captions, list) else json.loads(job.captions)
    for i, cap in enumerate(captions, start=1):
        start_ts = _seconds_to_srt_time(cap.get("start", 0))
        end_ts = _seconds_to_srt_time(cap.get("end", 0))
        text = cap.get("text", "")
        gloss = " ".join(cap.get("gloss", []))
        srt_lines.append(f"{i}")
        srt_lines.append(f"{start_ts} --> {end_ts}")
        srt_lines.append(text)
        if gloss:
            srt_lines.append(f"[ASL: {gloss}]")
        srt_lines.append("")

    srt_content = "\n".join(srt_lines)
    srt_path = os.path.join(PROCESSED_DIR, f"{job_id}.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(srt_content)

    return FileResponse(
        srt_path,
        media_type="text/plain",
        filename=f"signwave_{job_id[:8]}.srt",
    )


# ---------------------------------------------------------------------------
# Background processing pipeline
# ---------------------------------------------------------------------------

async def process_video(job_id: str, file_path: str):
    db = SessionLocal()
    try:
        job = db.query(DBJob).filter(DBJob.id == job_id).first()
        if not job:
            return

        audio_path = (
            file_path
            .replace(".mp4", ".mp3")
            .replace(".mkv", ".mp3")
            .replace(".mov", ".mp3")
            .replace(".webm", ".mp3")
        )

        job.status = "extracting_audio"
        job.progress = 10
        db.commit()
        await processor.extract_audio(file_path, audio_path)

        job.status = "transcribing"
        job.progress = 40
        db.commit()
        result = await processor.transcribe(audio_path)

        job.status = "processing_gloss"
        job.progress = 70
        db.commit()
        captions = await processor.generate_captions(result)

        job.status = "completed"
        job.progress = 100
        job.transcript = result["text"]
        job.captions = captions
        db.commit()

    except Exception as e:
        job = db.query(DBJob).filter(DBJob.id == job_id).first()
        if job:
            job.status = "failed"
            db.commit()
        print(f"Error processing {job_id}: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
