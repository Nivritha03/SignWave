import whisper
import os
import torch
import spacy
import re
from google import genai
from moviepy import VideoFileClip

# Initialize SpaCy for ASL linguistic reordering
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    print(f"WARNING: Failed to load SpaCy model 'en_core_web_sm'. Fallback translation will be limited. Error: {e}")
    nlp = None

class SignWaveProcessor:
    def __init__(self):
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Initialize Gemini if API key is in environment
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            self.llm_client = genai.Client(api_key=api_key)
            self.llm_model_name = 'gemini-2.5-flash'
            print(f"Gemini initialized successfully with {self.llm_model_name}.")
        else:
            print("WARNING: GEMINI_API_KEY not found. LLM translation will be disabled.")
            self.llm_client = None

    async def extract_audio(self, video_path: str, audio_path: str):
        import asyncio
        def _extract():
            clip = VideoFileClip(video_path)
            clip.audio.write_audiofile(audio_path, logger=None)
            clip.close()
        await asyncio.to_thread(_extract)

    async def transcribe(self, audio_path: str):
        if self.model is None:
            print(f"Loading Whisper 'small' model on {self.device}...")
            self.model = whisper.load_model("small", device=self.device)
        
        # Ensure ffmpeg bin folder is in PATH for Whisper to call it
        try:
            import imageio_ffmpeg
            ffmpeg_dir = os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
            if ffmpeg_dir not in os.environ["PATH"]:
                os.environ["PATH"] += os.path.pathsep + ffmpeg_dir
        except Exception as e:
            print(f"Failed to append imageio-ffmpeg to PATH: {e}")

        import asyncio
        print(f"Starting transcription...")
        fp16 = self.device != "cpu"
        return await asyncio.to_thread(self.model.transcribe, audio_path, fp16=fp16)

    async def translate_to_gloss(self, text: str):
        """
        Advanced Linguistic Translation Engine.
        Uses Gemini LLM if available, otherwise falls back to SpaCy-based reordering.
        """
        
        # Phase 1: Try LLM (State-of-the-art Translation)
        if self.llm_client:
            try:
                prompt = (
                    "Translate the following English sentence into American Sign Language (ASL) Gloss. "
                    "Use uppercase, remove small words like 'is', 'am', 'the', and use Topic-Comment structure. "
                    f"English: '{text}'"
                )
                response = self.llm_client.models.generate_content(
                    model=self.llm_model_name,
                    contents=prompt
                )
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
