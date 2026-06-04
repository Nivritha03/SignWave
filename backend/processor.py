import whisper
import os
import torch
from moviepy import VideoFileClip
import re

class SignWaveProcessor:
    def __init__(self):
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    async def extract_audio(self, video_path: str, audio_path: str):
        clip = VideoFileClip(video_path)
        clip.audio.write_audiofile(audio_path, logger=None)
        clip.close()

    async def transcribe(self, audio_path: str):
        if self.model is None:
            print(f"Loading Whisper model on {self.device}...")
            self.model = whisper.load_model("base", device=self.device)
        
        result = self.model.transcribe(audio_path)
        return result

    async def translate_to_gloss(self, text: str):
        """
        Advanced English-to-ASL Gloss Translation.
        In production, this should call an LLM (Gemini/GPT-4) with a specific 
        system prompt to handle ASL grammar (Topic-Comment, Time-First).
        """
        # --- LLM Integration Hook (Simulation) ---
        # prompt = f"Translate the following English sentence into ASL gloss format: '{text}'"
        # response = await llm.generate(prompt)
        # return response.strip().upper().split()
        
        # --- Advanced Rule-Based Engine (Fallback) ---
        text = text.upper()
        # 1. Clean punctuation
        text = re.sub(r'[^\w\s]', '', text)
        words = text.split()
        
        # 2. Extract Time Indicators (Time-First Rule)
        time_indicators = ["TODAY", "TOMORROW", "YESTERDAY", "NOW", "LATER", "WEEK", "MONTH", "YEAR"]
        times = [w for w in words if w in time_indicators]
        
        # 3. Handle Pronouns (Subject-Last tendency in ASL)
        pronouns = ["I", "ME", "YOU", "HE", "SHE", "IT", "WE", "THEY"]
        subjects = [w for w in words if w in pronouns]
        
        # 4. Filter "invisible" English words (ASL is a conceptual language)
        stop_words = ["AM", "IS", "ARE", "WAS", "WERE", "THE", "A", "AN", "TO", "BE", "OF"]
        content_words = [w for w in words if w not in stop_words and w not in time_indicators and w not in pronouns]
        
        # 5. Reconstruct ASL Gloss Structure (TIME - TOPIC - COMMENT - SUBJECT)
        gloss = times + content_words + subjects
        
        # Deduplicate while preserving order
        seen = set()
        final_gloss = [x for x in gloss if not (x in seen or seen.add(x))]
        
        return final_gloss

    async def generate_captions(self, transcription_result):
        captions = []
        for segment in transcription_result['segments']:
            gloss = await self.translate_to_gloss(segment['text'])
            captions.append({
                "start": segment['start'],
                "end": segment['end'],
                "text": segment['text'].strip(),
                "gloss": gloss
            })
        return captions
