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
        import subprocess
        def _extract():
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            try:
                subprocess.run([
                    ffmpeg_exe, "-i", video_path, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", "-y", audio_path
                ], check=True, capture_output=True, text=True)
            except subprocess.CalledProcessError as e:
                raise Exception(f"ffmpeg error: {e.stderr}")
        await asyncio.to_thread(_extract)

    async def transcribe(self, audio_path: str):
        if self.model is None:
            import asyncio
            print(f"Loading Whisper 'base' model on {self.device}...")
            self.model = await asyncio.to_thread(whisper.load_model, "base", device=self.device)

        
        # Monkey-patch Whisper's load_audio to use imageio_ffmpeg directly
        try:
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            
            import whisper.audio
            if not hasattr(whisper.audio, "_patched_for_ffmpeg"):
                original_load_audio = whisper.audio.load_audio
                def custom_load_audio(file: str, sr: int = whisper.audio.SAMPLE_RATE):
                    import subprocess
                    import numpy as np
                    cmd = [
                        ffmpeg_exe,
                        "-nostdin",
                        "-threads", "0",
                        "-i", file,
                        "-f", "s16le",
                        "-ac", "1",
                        "-acodec", "pcm_s16le",
                        "-ar", str(sr),
                        "-"
                    ]
                    try:
                        out = subprocess.run(cmd, capture_output=True, check=True).stdout
                    except subprocess.CalledProcessError as e:
                        raise RuntimeError(f"Failed to load audio: {e.stderr.decode() if e.stderr else str(e)}") from e
                    
                    return np.frombuffer(out, np.int16).flatten().astype(np.float32) / 32768.0

                whisper.audio.load_audio = custom_load_audio
                whisper.load_audio = custom_load_audio
                whisper.audio._patched_for_ffmpeg = True
                print("Successfully monkey-patched Whisper to use imageio_ffmpeg.")
        except Exception as e:
            print(f"Failed to monkey-patch Whisper: {e}")

        import asyncio
        import math
        print(f"Starting transcription...")
        fp16 = self.device != "cpu"
        result = await asyncio.to_thread(self.model.transcribe, audio_path, fp16=fp16)
        
        # Calculate stats
        segments = result.get("segments", [])
        if segments:
            duration = segments[-1].get("end", 0)
            avg_logprob = sum(s.get("avg_logprob", 0) for s in segments) / len(segments)
            confidence = f"{math.exp(avg_logprob) * 100:.1f}%"
        else:
            duration = 0
            confidence = "0%"
        
        result["stats"] = {
            "duration": duration,
            "confidence": confidence,
            "language": result.get("language", "unknown").upper()
        }
        return result

    async def translate_to_gloss(self, text: str):
        """
        Advanced Linguistic Translation Engine.
        Uses Gemini LLM if available, otherwise falls back to SpaCy-based reordering.
        """
        
        # Phase 1: Try LLM (State-of-the-art Translation)
        if self.llm_client:
            try:
                prompt = (
                    "You are an expert ASL translator. Translate the following English sentence into American Sign Language (ASL) Gloss. "
                    "RULES:\n"
                    "1. Use uppercase.\n"
                    "2. Remove small words like 'is', 'am', 'the'.\n"
                    "3. Use Topic-Comment structure.\n"
                    "4. Output ONLY the resulting gloss tokens separated by spaces. Do not include any explanations, conversational text, options, or Markdown formatting.\n\n"
                    f"English: '{text}'\n"
                    "ASL Gloss:"
                )
                response = self.llm_client.models.generate_content(
                    model=self.llm_model_name,
                    contents=prompt
                )
                import re
                clean_text = re.sub(r'[^\w\s-]', '', response.text)
                return clean_text.upper().split()
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
