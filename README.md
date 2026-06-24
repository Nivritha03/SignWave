# SignWave – AI‑Powered Sign Language Translation & Captioning System

## 🎯 Overview
**SignWave** is a full‑stack, end‑to‑end solution that transforms spoken language into sign‑language video captions in real time. It combines:
- **FastAPI** back‑end for audio extraction, Whisper transcription, gloss generation and job management.
- **Next.js (React 19)** front‑end with a sleek, glassmorphic UI, three‑dimensional animated avatars (`@react‑three/fiber` + `@react‑three/drei`).
- **SQLite** (or any SQL‑Alchemy compatible DB) for user accounts and job tracking.
- **OpenAI Whisper** for accurate speech‑to‑text, and a custom ASL gloss engine that maps transcriptions to animated sign‑language sequences.

The result is an accessible video that displays both spoken subtitles and a live 3‑D avatar performing the corresponding sign language.

---

## ✨ Key Features
- **Secure Authentication** – JWT based login/registration.
- **Video Upload & Async Processing** – Upload any video; processing runs in the background (audio extraction → transcription → gloss generation → avatar rendering).
- **Real‑time Dashboard** – View job status, progress bar, export final video.
- **3‑D Avatar with Gloss Mapping** – Ready‑Player‑Me avatar driven by GLTF animation clips for common ASL signs (HELLO, WELCOME, …).
- **Exportable MP4** – Download the final sign‑language video.
- **Responsive, Dark‑mode UI** – Tailwind CSS with glassmorphism, gradients and subtle micro‑animations.
- **Extensible Architecture** – Easy to plug in new language models, datasets or additional avatar animations.

---

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| **Backend** | FastAPI, Uvicorn, SQLAlchemy, SQLite (default), OpenAI Whisper, FFmpeg, Python‑dotenv |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, @react‑three/fiber, @react‑three/drei, lucide‑react |
| **3‑D Assets** | Ready‑Player‑Me GLB avatar, custom ASL animation clips (GLB) |
| **Deployment** | Docker (optional), `npm run dev` / `uvicorn` locally |

## 👤 Avatar System

Current MVP uses two built-in premium avatars:
- **Maya** (Female)
- **Alex** (Male)

This avoids rigging and animation compatibility issues.

Future versions may support:
- Custom user avatars (Ready-Player-Me / MetaHuman)
- Emotion-aware signing
- Avatar marketplace

---

## 🚀 Getting Started
### Prerequisites
- **Python ≥3.9**
- **Node ≥20**
- **Git**
- **FFmpeg** (available in system PATH) – required for audio extraction.

### 1. Clone the repository
```bash
git clone https://github.com/your‑username/SignWave.git
cd SignWave
```

### 2. Backend Setup
```bash
# Create a virtual environment
python -m venv venv
source venv/scripts/activate   # Windows PowerShell

# Install dependencies
pip install -r backend/requirements.txt
```
#### Environment variables
Create a `.env` file in `backend/` (or copy the example):
```dotenv
# backend/.env
SECRET_KEY=your_super_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440   # 24 hours
```
> **Tip:** Use a strong, random secret key.

#### Run the API
```bash
cd backend
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
#### Environment variables (optional)
If you change the API host/port, update `frontend/.env.local`:
```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```
#### Run the dev server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📚 API Reference
| Endpoint | Method | Description |
|---|---|---|
| `/register` | POST | Register a new user (returns JWT). |
| `/login` | POST | Authenticate user (returns JWT). |
| `/upload` | POST | Upload video file; creates a new job and starts background processing. |
| `/api/upload/video` | POST | Upload video file; schedules background audio extraction, transcription, and sign translation. |
| `/api/upload/audio` | POST | Upload audio file directly; bypasses video extraction and schedules transcription/sign translation. |
| `/job/{job_id}` | GET | Retrieve job status, progress, transcript and generated captions. |
| `/export/{job_id}` | POST | Generate a downloadable MP4 of the final avatar video. |
| `/files/{file_id}` | GET | Serve uploaded raw video files. |

All protected endpoints require the `Authorization: Bearer <token>` header.

---

## 🎬 Frontend Flow
1. **Landing Page** – Intro and navigation to **Login** or **Register**.
2. **Dashboard** – Shows a list of the user’s jobs, each with a status badge.
3. **Job Viewer** – Displays the video player, caption timeline, and a transcript panel. The 3‑D avatar animates according to the generated gloss sequence.
4. **Export** – Once a job is `completed`, the *Export* button becomes active, providing a downloadable MP4.

---

## 🤝 Contributing
1. Fork the project.
2. Create a feature branch (`git checkout -b feature/awesome‑feature`).
3. Make your changes, ensure linting passes (`npm run lint` & `ruff` for Python).
4. Write tests where applicable.
5. Submit a Pull Request with a clear description of the change.

We follow the **Conventional Commits** style for commit messages.

---

## 📄 License
This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## ✨ Acknowledgements
- **OpenAI Whisper** – Speech‑to‑text engine.
- **Ready‑Player‑Me** – Avatar source.
- **WLASL‑Retargeted** – Dataset for ASL gloss animations.
- **Tailwind Labs** – Utility‑first CSS framework.
- **React Three Fiber** – Declarative 3‑D rendering in React.

---

## 📞 Support & Contact
For questions, issues, or feature requests, please open an issue on GitHub or contact the maintainer at `nivritha@example.com`.

---



---

## 🛠️ Used Packages

### Backend (Python)
- **FastAPI** – Web framework for the API
- **Uvicorn** – ASGI server
- **SQLAlchemy** – ORM for SQLite (or other DBs)
- **SQLite** – Default relational database
- **python-dotenv** – Load environment variables from `.env`
- **OpenAI Whisper** – Speech‑to‑text transcription
- **ffmpeg‑python** – Audio extraction from video files
- **pydantic** – Data validation
- **PyJWT** – JWT token handling
- **WebSockets** – Real‑time audio streaming for live transcription

### Frontend (JavaScript/TypeScript)
- **Next.js 16** – React framework with server‑side rendering
- **React 19** – UI library
- **TypeScript** – Type safety
- **Tailwind CSS 4** – Utility‑first styling (glassmorphism, gradients, etc.)
- **@react‑three/fiber** – Declarative Three.js in React
- **@react‑three/drei** – Helpful helpers for 3D scenes
- **lucide-react** – Icon set
- **framer‑motion** – Animations and micro‑interactions
- **gsap** – Advanced timeline‑based animations
- **axios** – HTTP client for API calls
- **socket.io‑client** – WebSocket communication for real‑time transcription

## 🔧 Environment Variables (`backend/.env`)
```
SECRET_KEY=your_super_secret_key_here        # Used for JWT signing
ACCESS_TOKEN_EXPIRE_MINUTES=1440            # Token lifetime (minutes)
```
Add any additional variables required by your deployment (e.g., DB URL, OpenAI API key).

---

## 🚀 Upcoming Features (Planned)

### 1️⃣ Real‑Time Mode (Highest Impact)
- **Microphone → Live Speech → Live Captions → Live Sign Avatar**
- Implemented via WebSockets, Whisper streaming, and Deepgram.

### 2️⃣ Multi‑Language Support
- Add Hindi, Telugu, Tamil, French, German, Spanish.
- Flow: Speech → Transcription → Translation → Sign Generation.

### 3️⃣ Emotion‑Aware Avatar
- Detect emotions (happy, serious, excited) using Wav2Vec2.
- Avatar facial expression adapts to speech emotion.

### 4️⃣ Speaker Identification
- Use pyannote.audio to label speakers in transcripts.
- Useful for meetings, podcasts, interviews.

### 5️⃣ AI Accessibility Score
- Compute a score (e.g., 92/100) based on caption quality, reading speed, contrast, timing.
- Display grade (A‑F) on dashboard.

### 6️⃣ AI Caption Enhancement
- Grammar correction, punctuation, speaker labels, context cleanup.

### 7️⃣ YouTube URL Support
- Paste YouTube URL, auto‑download, transcribe, translate, sign.

### 8️⃣ Meeting Assistant
- Integration with Zoom, Google Meet, Teams, Webex.
- Live transcript and sign language overlay.

### 9️⃣ AI Gloss Explanation
- Show original phrase, gloss, and meaning for each sign.

### 🔟 Interactive Avatar Controls
- Adjust avatar speed, gender, style, camera angle.

### 1️⃣1️⃣ Better Dashboard
- Projects overview, AI analytics, accessibility impact, language usage, minutes processed, avatar usage, accuracy metrics, charts.

### 1️⃣2️⃣ Enterprise Features
- Team workspaces, member invites, shared projects, role management.

### 1️⃣3️⃣ AI Search
- Search transcripts for keywords with timestamps.

### 1️⃣4️⃣ Export Options
- MP4, SRT, VTT, TXT, PDF, DOCX transcripts.

### 1️⃣5️⃣ Avatar Quality Upgrade
- MetaHuman‑style or premium Ready‑Player‑Me avatars with advanced hand rigging and facial expressions.

### 1️⃣6️⃣ AI Insights Panel
- Speaking speed, emotion, sentiment, keywords, topics, summary, action items.

### 1️⃣7️⃣ Mobile Experience
- SignWave Mobile app with camera → live sign translation.

### 1️⃣8️⃣ Accessibility Twin
- After processing, generate a comprehensive report with caption quality, accessibility score, readability, improvement suggestions.

*Happy coding and thank you for making the world more accessible!*
