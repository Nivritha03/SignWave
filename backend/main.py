import os
import uuid
import shutil
import subprocess
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from processor import SignWaveProcessor
from database import get_db, SessionLocal, User as DBUser, Job as DBJob
from auth import get_password_hash, verify_password, create_access_token, decode_access_token

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
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: str
    password: str

# Dependency to get current user
async def get_current_user(token: str, db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    email: str = payload.get("sub")
    user = db.query(DBUser).filter(DBUser.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@app.get("/")
async def root():
    return {"message": "SignWave AI API is running"}

# Auth Endpoints
@app.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(DBUser).filter(DBUser.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pass = get_password_hash(user_data.password)
    new_user = DBUser(email=user_data.email, hashed_password=hashed_pass, full_name=user_data.full_name)
    db.add(new_user)
    db.commit()
    
    token = create_access_token(data={"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# Secured Endpoints
@app.get("/jobs", response_model=List[dict])
async def list_jobs(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return [
        {"id": j.id, "status": j.status, "progress": j.progress, "date": j.created_at.strftime("%Y-%m-%d")} 
        for j in current_user.projects
    ]

@app.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    token: str = None, # Simplified for demo, should be Header
    db: Session = Depends(get_db)
):
    # In a real app, use Depends(get_current_user) but for easier testing from frontend:
    user = await get_current_user(token, db) if token else None
    if not user: raise HTTPException(401)

    job_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}{file_extension}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_job = DBJob(
        id=job_id, 
        status="queued", 
        progress=0, 
        owner_id=user.id,
        video_url=f"http://localhost:8000/files/{job_id}{file_extension}"
    )
    db.add(new_job)
    db.commit()
    
    background_tasks.add_task(process_video, job_id, file_path)
    return {"job_id": job_id}

@app.get("/job/{job_id}")
async def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not job:
        return {"error": "Job not found"}
    return job

@app.get("/files/{file_id}")
async def get_file(file_id: str):
    for ext in ['.mp4', '.mp3', '.mkv', '.mov']:
        path = os.path.join(UPLOAD_DIR, f"{file_id}") if '.' in file_id else os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
        if os.path.exists(path):
            return FileResponse(path)
    return {"error": "File not found"}

async def process_video(job_id: str, file_path: str):
    db = SessionLocal() # Use fresh session for background task
    try:
        job = db.query(DBJob).filter(DBJob.id == job_id).first()
        audio_path = file_path.replace(".mp4", ".mp3").replace(".mkv", ".mp3").replace(".mov", ".mp3")
        
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
        job.transcript = result['text']
        job.captions = captions
        db.commit()
        
    except Exception as e:
        job = db.query(DBJob).filter(DBJob.id == job_id).first()
        if job: job.status = "failed"
        db.commit()
        print(f"Error processing {job_id}: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
