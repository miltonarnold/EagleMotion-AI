python
from pathlib import Path
from uuid import uuid4

import torchaudio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from chatterbox.mtl_tts import ChatterboxMultilingualTTS


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = PROJECT_ROOT / "ai-models" / "chatterbox-multilingual"

OUTPUT_DIR = PROJECT_ROOT / "ai-services" / "tts" / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


app = FastAPI(title="EagleMotion TTS API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://eaglemotion-ai.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


print("Loading Chatterbox Multilingual TTS...")
print(f"Model: {MODEL_PATH}")

model = ChatterboxMultilingualTTS.from_local(
    str(MODEL_PATH),
    device="cpu"
)

print("TTS API MODEL LOADED")


class SpeechRequest(BaseModel):
    text: str
    language: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "EagleMotion TTS"
    }


@app.post("/tts")
def generate_tts(request: SpeechRequest):

    language = request.language.lower().strip()
    text = request.text.strip()

    if language not in {"en", "sw"}:
        raise HTTPException(
            status_code=400,
            detail="Language must be 'en' or 'sw'."
        )

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )

    filename = f"{uuid4().hex}.wav"
    output_file = OUTPUT_DIR / filename

    print(f"Generating {language} speech...")
    print(f"Text: {text}")

    try:
        wav = model.generate(
            text,
            language_id=language
        )

        torchaudio.save(
            str(output_file),
            wav,
            model.sr
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    print(f"AUDIO CREATED: {output_file}")

    return {
        "success": True,
        "language": language,
        "file": filename,
        "audio_url": f"/audio/{filename}"
    }


@app.get("/audio/{filename}")
def get_audio(filename: str):

    audio_file = OUTPUT_DIR / filename

    if not audio_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Audio file not found."
        )

    return FileResponse(
        path=str(audio_file),
        media_type="audio/wav",
        filename=filename
    )
