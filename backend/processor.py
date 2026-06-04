import whisper
import os
import torch
import spacy
import re
import google.generativeai as genai
from moviepy import VideoFileClip

# Initialize SpaCy for ASL linguistic reordering
try:
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = None

class SignWaveProcessor:
    def __init__(self):
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Initialize Gemini if API key is in environment
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.llm = genai.GenerativeModel('gemini-pro')
        else:
            self.llm = None

    async def extract_audio(self, video_path: str, audio_path: str):
        clip = VideoFileClip(video_path)
        clip.audio.write_audiofile(audio_path, logger=None)
        clip.close()

    async def transcribe(self, audio_path: str):
        if self.model is None:
            self.model = whisper.load_model("base", device=self.device)
        return self.model.transcribe(audio_path)

    async def translate_to_gloss(self, text: str):
        """
        Advanced Linguistic Translation Engine.
        Uses Gemini LLM if available, otherwise falls back to SpaCy-based reordering.
        """
        
        # Phase 1: Try LLM (State-of-the-art Translation)
        if self.llm:
            try:
                prompt = (
                    "Translate the following English sentence into American Sign Language (ASL) Gloss. "
                    "Use uppercase, remove small words like 'is', 'am', 'the', and use Topic-Comment structure. "
                    f"English: '{text}'"
                )
                response = self.llm.generate_content(prompt)
                return response.text.upper().replace('.', '').split()
            except Exception as e:
                print(f"LLM Translation failed: {e}")

        # Phase 2: SpaCy Linguistic Fallback (High Accuracy Rules)
        if nlp:
            doc = nlp(text)
            
            # Extract components
            subject = [token.text.upper() for token in doc if "subj" in token.dep_]
            verb = [token.text.upper() for token in doc if token.pos_ == "VERB"]
            obj = [token.text.upper() for token in doc if "obj" in token.dep_]
            time = [token.text.upper() for token in doc if token.ent_type_ in ["DATE", "TIME"] or token.text.upper() in ["TODAY", "TOMORROW", "YESTERDAY"]]
            
            # Filter stop words and punctuation
            invisible = ["AM", "IS", "ARE", "WAS", "WERE", "THE", "A", "AN", "TO", "OF", "BE"]
            
            # Apply ASL Structure: [TIME] [TOPIC/OBJECT] [VERB] [SUBJECT]
            gloss = time + obj + verb + subject
            
            # Fallback if SpaCy components weren't found
            if not gloss:
                words = [token.text.upper() for token in doc if not token.is_punct and token.text.upper() not in invisible]
                gloss = words
                
            return gloss

        # Phase 3: Simple Mock (Last Resort)
        return text.upper().split()

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
