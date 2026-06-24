import os
import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

genai_api_key = os.getenv("GENAI_API_KEY")
if not genai_api_key:
    raise RuntimeError("GENAI_API_KEY not set in environment")

genai.configure(api_key=genai_api_key)

model = genai.GenerativeModel('gemini-1.5-flash')

class TranslationRequest(BaseModel):
    text: str
    target_lang: str  # e.g., 'hi', 'te', 'ta', 'fr', 'de', 'es'

@router.post("/translate")
async def translate(req: TranslationRequest):
    prompt = f"Translate the following text to {req.target_lang} while preserving meaning and tone. Return only the translated text.\n\n{req.text}"
    try:
        response = model.generate_content(prompt)
        translated = response.text.strip()
        return {"translated": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
