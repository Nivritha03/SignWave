import os
import uuid
import shutil
import json
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

from database import get_db, SessionLocal, Job as DBJob
from processor import SignWaveProcessor

# Initialize the processor
processor = SignWaveProcessor()


app = FastAPI(title="SignWave AI Backend")


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
    return {"job_id": job_id, "status": "uploaded"}


@app.post("/api/upload/video")
async def upload_video_api(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await upload_video(background_tasks, file, db)


@app.post("/api/upload/audio")
async def upload_audio_api(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    job_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename or "audio.mp3")[1] or ".mp3"
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
    return {"job_id": job_id, "status": "uploaded"}


from pydantic import BaseModel
class LinkPayload(BaseModel):
    url: str

@app.post("/api/upload/link")
async def upload_link_api(
    payload: LinkPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    url = payload.url
    job_id = str(uuid.uuid4())
    
    # Check extension or default to .mp4
    ext = ".mp4"
    if ".mp3" in url.lower():
        ext = ".mp3"
    elif ".wav" in url.lower():
        ext = ".wav"
        
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")
    
    new_job = DBJob(
        id=job_id,
        status="queued",
        progress=0,
        owner_id=None,
        video_url=url,
    )
    db.add(new_job)
    db.commit()
    
    background_tasks.add_task(process_link, job_id, url, file_path)
    return {"job_id": job_id, "status": "uploaded"}




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
        "confidence": job.confidence,
        "language": job.language,
        "duration": job.duration,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }

@app.get("/transcript/{job_id}")
async def get_transcript(job_id: str, db: Session = Depends(get_db)):
    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"transcript": job.transcript}

@app.get("/gloss/{job_id}")
async def get_gloss(job_id: str, db: Session = Depends(get_db)):
    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    # Return array of words from captions
    gloss_list = []
    if job.captions:
        captions = json.loads(job.captions) if isinstance(job.captions, str) else job.captions
        for cap in captions:
            if "gloss" in cap:
                gloss_list.extend(cap["gloss"])
    return {"gloss": gloss_list}

@app.get("/status/{job_id}")
async def get_status_endpoint(job_id: str, db: Session = Depends(get_db)):
    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": job.status, "progress": job.progress}

@app.get("/video/{job_id}")
async def get_video_endpoint(job_id: str, db: Session = Depends(get_db)):
    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"video_url": job.video_url}


# ---------------------------------------------------------------------------
# Animation Endpoint — returns clip references for each gloss token
# ---------------------------------------------------------------------------

# A curated mapping of common ASL gloss tokens → animation clip names.
# If a clip file exists in /public/animations/, it will be referenced.
# Otherwise, the avatar will play its idle pose.
GLOSS_CLIP_MAP: dict = {
    "HELLO": "hello",
    "GOODBYE": "goodbye",
    "THANK": "thank_you",
    "THANK_YOU": "thank_you",
    "PLEASE": "please",
    "SORRY": "sorry",
    "HELP": "help",
    "YES": "yes",
    "NO": "no",
    "NAME": "name",
    "LEARN": "learn",
    "UNDERSTAND": "understand",
    "WELCOME": "welcome",
    "TODAY": "today",
    "TOMORROW": "tomorrow",
    "YESTERDAY": "yesterday",
    "MORNING": "morning",
    "NIGHT": "night",
    "GOOD": "good",
    "BAD": "bad",
    "HAPPY": "happy",
    "SAD": "sad",
    "LOVE": "love",
    "FAMILY": "family",
    "FRIEND": "friend",
    "WORK": "work",
    "SCHOOL": "school",
    "LECTURE": "lecture",
    "SIGN": "sign",
    "LANGUAGE": "language",
    "INTERPRET": "interpret",
    "TRANSLATE": "translate",
}

@app.get("/animation/{job_id}")
async def get_animation(job_id: str, db: Session = Depends(get_db)):
    """Returns a list of {gloss, clip} pairs for the job."""
    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed" or not job.captions:
        return {"animations": [], "status": job.status}

    captions = job.captions if isinstance(job.captions, list) else json.loads(job.captions)
    animations = []
    for cap in captions:
        for gloss_word in cap.get("gloss", []):
            clip_name = GLOSS_CLIP_MAP.get(gloss_word.upper(), None)
            animations.append({
                "gloss": gloss_word,
                "clip": clip_name,  # None means use idle/default pose
                "start": cap.get("start", 0),
                "end": cap.get("end", 0),
            })
    return {"animations": animations}


# ---------------------------------------------------------------------------
# Generate-Motion Stub — architecture hook for future trained model
# ---------------------------------------------------------------------------

class GenerateMotionRequest(BaseModel):
    gloss: list  # e.g. ["TODAY", "LECTURE", "WELCOME"]
    avatar: str = "alex"  # "alex" or "maya"

@app.post("/generate-motion")
async def generate_motion(req: GenerateMotionRequest):
    """
    Stub endpoint: translates gloss tokens into animation clip references.
    Future: replace body with call to trained MotionGPT / Diffusion model.
    """
    result = []
    for word in req.gloss:
        clip = GLOSS_CLIP_MAP.get(word.upper(), None)
        result.append({"gloss": word, "clip": clip, "source": "clip_map"})
    return {
        "avatar": req.avatar,
        "motions": result,
        "note": "Using pre-mapped animation clips. Connect a trained model here for generative pose data."
    }


# ---------------------------------------------------------------------------
# API Status / Health
# ---------------------------------------------------------------------------

@app.get("/api/status")
async def api_status():
    """Health check and pipeline capability summary."""
    gemini_enabled = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status": "ok",
        "pipeline": {
            "speech_recognition": "whisper-base",
            "gloss_translation": "gemini-2.5-flash" if gemini_enabled else "spacy-fallback",
            "motion_generation": "clip_map_stub",
            "avatar_rigging": "react-three-fiber",
        },
        "gemini_llm": gemini_enabled,
    }


@app.get("/files/{file_id}")
async def get_file(file_id: str):
    # Try with the file_id as-is (may already include extension)
    if "." in file_id:
        # Case-insensitive search in uploads directory
        path = os.path.join(UPLOAD_DIR, file_id)
        if os.path.exists(path):
            return FileResponse(path)
        # Try case variants
        for fname in os.listdir(UPLOAD_DIR):
            if fname.lower() == file_id.lower():
                return FileResponse(os.path.join(UPLOAD_DIR, fname))
    else:
        for ext in [".mp4", ".MP4", ".mp3", ".mkv", ".mov", ".webm"]:
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

        _, ext = os.path.splitext(file_path)
        is_audio = ext.lower() in [".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".wma"]

        try:
            if is_audio:
                audio_path = file_path
            else:
                # Use os.path.splitext to handle both .mp4 and .MP4
                base, _ = os.path.splitext(file_path)
                audio_path = base + ".wav"

                job.status = "extracting_audio"
                job.progress = 10
                db.commit()
                await processor.extract_audio(file_path, audio_path)

            job.status = "transcribing"
            job.progress = 40
            db.commit()
            result = await processor.transcribe(audio_path)
            
            # Update job with stats
            if "stats" in result:
                job.confidence = result["stats"]["confidence"]
                job.language = result["stats"]["language"]
                job.duration = result["stats"]["duration"]
                
        except Exception as proc_err:
            import traceback
            with open("error_log.txt", "a") as f:
                f.write(f"Error processing video file {job_id}: {proc_err}\n")
                f.write(traceback.format_exc() + "\n")
            print(f"Error processing video file {job_id}: {proc_err}.")
            raise proc_err

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


async def process_link(job_id: str, url: str, file_path: str):
    db = SessionLocal()
    try:
        job = db.query(DBJob).filter(DBJob.id == job_id).first()
        if not job:
            return

        job.status = "queued"
        job.progress = 5
        db.commit()

        download_success = False
        audio_path = None

        # --- Strategy 1: yt-dlp (handles YouTube, Vimeo, and most media URLs) ---
        try:
            import subprocess
            import sys
            job.status = "extracting_audio"
            job.progress = 10
            db.commit()

            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

            audio_out = file_path + ".%(ext)s"
            ytdlp_cmd = [
                sys.executable, "-m", "yt_dlp",
                "--no-playlist",
                "--extract-audio",
                "--audio-format", "mp3",
                "--audio-quality", "5",
                "--ffmpeg-location", ffmpeg_exe,
                "-o", audio_out,
                "--quiet",
                url,
            ]
            import asyncio
            result_proc = await asyncio.to_thread(
                subprocess.run, ytdlp_cmd, capture_output=True, text=True, timeout=300
            )
            if result_proc.returncode == 0:
                # yt-dlp names the output with the resolved extension
                candidate = file_path + ".mp3"
                if os.path.exists(candidate) and os.path.getsize(candidate) > 0:
                    audio_path = candidate
                    download_success = True
                    print(f"yt-dlp download succeeded: {audio_path}")
                else:
                    with open("error_log.txt", "a") as f:
                        f.write(f"yt-dlp ran but output not found. stderr: {result_proc.stderr}\n")
                    print(f"yt-dlp ran but output not found. stderr: {result_proc.stderr}")
            else:
                with open("error_log.txt", "a") as f:
                    f.write(f"yt-dlp failed (rc={result_proc.returncode}): {result_proc.stderr}\n")
                print(f"yt-dlp failed (rc={result_proc.returncode}): {result_proc.stderr}")
        except Exception as yt_err:
            with open("error_log.txt", "a") as f:
                f.write(f"yt-dlp strategy failed: {yt_err}\n")
            print(f"yt-dlp strategy failed: {yt_err}")

        # --- Strategy 2: httpx direct download (fallback for plain file URLs) ---
        if not download_success:
            try:
                import httpx
                job.status = "extracting_audio"
                job.progress = 10
                db.commit()
                import asyncio
                def download_httpx():
                    with open(file_path, "wb") as f:
                        with httpx.stream("GET", url, follow_redirects=True, timeout=120.0) as r:
                            r.raise_for_status()
                            content_type = r.headers.get("content-type", "")
                            if "text/html" in content_type:
                                raise Exception(f"URL points to an HTML page, not a direct media file. ({content_type})")
                            for chunk in r.iter_bytes():
                                f.write(chunk)
                await asyncio.to_thread(download_httpx)
                if os.path.getsize(file_path) > 1000:
                    download_success = True
                    print(f"httpx direct download succeeded: {file_path}")
            except Exception as dl_err:
                print(f"httpx direct download failed: {dl_err}")

        # --- Strategy 3: Process downloaded file ---
        result = None
        if download_success:
            try:
                if audio_path is None:
                    # Direct download — extract audio if video
                    _, ext = os.path.splitext(file_path)
                    is_audio = ext.lower() in [".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".wma"]
                    if is_audio:
                        audio_path = file_path
                    else:
                        audio_path = file_path + ".wav"
                        await processor.extract_audio(file_path, audio_path)

                job.status = "transcribing"
                job.progress = 40
                db.commit()
                result = await processor.transcribe(audio_path)
                print(f"Transcription successful for job {job_id}")
                
                # Update job with stats
                if "stats" in result:
                    job.confidence = result["stats"]["confidence"]
                    job.language = result["stats"]["language"]
                    job.duration = result["stats"]["duration"]
                    
            except Exception as proc_err:
                import traceback
                with open("error_log.txt", "a") as f:
                    f.write(f"Error processing downloaded file for job {job_id}: {proc_err}\n")
                    f.write(traceback.format_exc() + "\n")
                print(f"Error processing downloaded file for job {job_id}: {proc_err}")
                raise proc_err

        if result is None:
            import traceback
            with open("error_log.txt", "a") as f:
                f.write(f"All download strategies failed for {url}.\n")
            raise Exception("Failed to download or transcribe media")

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
        db_job = db.query(DBJob).filter(DBJob.id == job_id).first()
        if db_job:
            db_job.status = "failed"
            db.commit()
        print(f"Error processing link {job_id}: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
