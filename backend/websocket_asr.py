import os
import io
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

router = APIRouter()

# Placeholder transcription function – in production replace with actual ASR (e.g., Whisper)
import os
import io
import json
import wave
import numpy as np
import asyncio
import whisper
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# Load Whisper model once (base model for speed)
model = whisper.load_model("base", device="cpu")

# Simple audio buffer for accumulating PCM 16-bit little‑endian samples
class AudioBuffer:
    def __init__(self, sample_rate: int = 16000, chunk_seconds: int = 1):
        self.sample_rate = sample_rate
        self.chunk_size = sample_rate * chunk_seconds * 2  # 2 bytes per sample
        self.buffer = bytearray()

    def add(self, data: bytes):
        self.buffer.extend(data)
        if len(self.buffer) >= self.chunk_size:
            chunk = bytes(self.buffer[:self.chunk_size])
            self.buffer = self.buffer[self.chunk_size:]
            return chunk
        return None

async def transcribe_chunk(chunk_bytes: bytes) -> str:
    # Convert raw PCM 16‑bit little‑endian to float32 numpy array expected by Whisper
    audio_np = np.frombuffer(chunk_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    # Whisper expects a mono audio array; we already have that
    result = await asyncio.to_thread(model.transcribe, audio_np, fp16=False)
    return result.get("text", "")

@router.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    await websocket.accept()
    buffer = AudioBuffer()
    try:
        while True:
            data = await websocket.receive_bytes()
            chunk = buffer.add(data)
            if chunk:
                transcript = await transcribe_chunk(chunk)
                await websocket.send_json({"text": transcript})
    except WebSocketDisconnect:
        await websocket.close()
    except Exception as e:
        await websocket.send_json({"error": str(e)})
        await websocket.close()

# Simple HTML client for testing (optional)
@router.get("/ws_test", response_class=HTMLResponse)
async def ws_test():
    html_content = """
    <!DOCTYPE html>
    <html>
      <head><title>ASR WebSocket Test</title></head>
      <body>
        <h2>WebSocket ASR Test</h2>
        <pre id="output"></pre>
        <script>
      </body>
    </html>
    """
    return html_content
