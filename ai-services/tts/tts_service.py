from pathlib import Path
import sys

import torchaudio
from chatterbox.mtl_tts import ChatterboxMultilingualTTS


# EagleMotion project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Local Chatterbox model
MODEL_PATH = PROJECT_ROOT / "ai-models" / "chatterbox-multilingual"

# Output directory
OUTPUT_DIR = PROJECT_ROOT / "ai-services" / "tts" / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_model():
    print("Loading Chatterbox Multilingual TTS...")
    print(f"Model: {MODEL_PATH}")

    model = ChatterboxMultilingualTTS.from_local(
        str(MODEL_PATH),
        device="cpu"
    )

    print("TTS MODEL LOADED")
    return model


def generate_speech(model, text, language, filename):
    language = language.lower().strip()

    if language not in {"en", "sw"}:
        raise ValueError("Language must be 'en' or 'sw'.")

    if not text.strip():
        raise ValueError("Text cannot be empty.")

    output_file = OUTPUT_DIR / filename

    print(f"Generating {language} speech...")
    print(f"Text: {text}")

    wav = model.generate(
        text,
        language_id=language
    )

    torchaudio.save(
        str(output_file),
        wav,
        model.sr
    )

    print(f"AUDIO CREATED: {output_file}")

    return output_file


def main():
    if len(sys.argv) < 4:
        print(
            "Usage:\n"
            "python tts_service.py <en|sw> \"text\" filename.wav"
        )
        sys.exit(1)

    language = sys.argv[1]
    text = sys.argv[2]
    filename = sys.argv[3]

    model = load_model()

    generate_speech(
        model,
        text,
        language,
        filename
    )


if __name__ == "__main__":
    main()