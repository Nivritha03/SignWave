import os
import uuid
import shutil
import subprocess
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from processor import SignWaveProcessor

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

class ProcessingJob(BaseModel):
    id: str
    status: str
    progress: int
    transcript: Optional[str] = None
    captions: Optional[List[dict]] = None
    video_url: Optional[str] = None
    exported_url: Optional[str] = None

jobs = {}

@app.get("/")
async def root():
    return {"message": "SignWave AI API is running"}

@app.post("/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}{file_extension}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    jobs[job_id] = ProcessingJob(
        id=job_id, 
        status="queued", 
        progress=0,
        video_url=f"http://localhost:8000/files/{job_id}{file_extension}"
    )
    
    background_tasks.add_task(process_video, job_id, file_path)
    return {"job_id": job_id}

@app.get("/job/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in jobs:
        return {"error": "Job not found"}
    return jobs[job_id]

@app.get("/files/{file_id}")
async def get_file(file_id: str):
    # Try multiple common extensions
    for ext in ['.mp4', '.mp3', '.mkv', '.mov']:
        path = os.path.join(UPLOAD_DIR, f"{file_id}") if '.' in file_id else os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
        if os.path.exists(path):
            return FileResponse(path)
    return {"error": "File not found"}

@app.post("/export/{job_id}")
async def export_video(job_id: str):
    if job_id not in jobs or jobs[job_id].status != "completed":
        return {"error": "Job not ready for export"}
    
    job = jobs[job_id]
    input_video = os.path.join(UPLOAD_DIR, f"{job_id}.mp4") # Simplified
    output_video = os.path.join(PROCESSED_DIR, f"{job_id}_exported.mp4")
    srt_path = os.path.join(PROCESSED_DIR, f"{job_id}.srt")
    
    # Generate SRT file
    with open(srt_path, "w", encoding="utf-8") as f:
        for i, cap in enumerate(job.captions):
            start = format_srt_time(cap['start'])
            end = format_srt_time(cap['end'])
            f.write(f"{i+1}\n{start} --> {end}\n{cap['text']}\n\n")
            
    # Burn subtitles using FFmpeg
    try:
        command = [
            'ffmpeg', '-i', input_video,
            '-vf', f"subtitles={srt_path.replace('\\', '/')}",
            '-c:a', 'copy',
            '-y', output_video
        ]
        subprocess.run(command, check=True)
        job.exported_url = f"http://localhost:8000/download/{job_id}"
        return {"message": "Export completed", "url": job.exported_url}
    except Exception as e:
        return {"error": f"FFmpeg failed: {str(e)}"}

@app.get("/download/{job_id}")
async def download_exported(job_id: str):
    path = os.path.join(PROCESSED_DIR, f"{job_id}_exported.mp4")
    if os.path.exists(path):
        return FileResponse(path, filename=f"SignWave_{job_id}.mp4")
    return {"error": "Exported file not found"}

def format_srt_time(seconds: float) -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    msecs = int((seconds * 1000) % 1000)
    return f"{hrs:02}:{mins:02}:{secs:02},{msecs:03}"

async def process_video(job_id: str, file_path: str):
    try:
        audio_path = file_path.replace(".mp4", ".mp3").replace(".mkv", ".mp3").replace(".mov", ".mp3")
        
        jobs[job_id].status = "extracting_audio"
        jobs[job_id].progress = 10
        await processor.extract_audio(file_path, audio_path)
        
        jobs[job_id].status = "transcribing"
        jobs[job_id].progress = 40
        result = await processor.transcribe(audio_path)
        
        jobs[job_id].status = "processing_gloss"
        jobs[job_id].progress = 70
        captions = await processor.generate_captions(result)
        
        jobs[job_id].status = "completed"
        jobs[job_id].progress = 100
        jobs[job_id].transcript = result['text']
        jobs[job_id].captions = captions
        
    except Exception as e:
        jobs[job_id].status = "failed"
        print(f"Error processing {job_id}: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
