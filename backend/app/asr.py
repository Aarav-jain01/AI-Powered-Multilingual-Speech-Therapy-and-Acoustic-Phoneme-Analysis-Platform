import os, logging
from functools import lru_cache
import numpy as np

log = logging.getLogger("vocalis.asr")
MODEL = os.getenv("ASR_MODEL", "openai/whisper-small")  # configurable; multilingual
LANG_NAMES = {"en": "english", "hi": "hindi"}

class ASRUnavailable(RuntimeError):
    pass

@lru_cache(maxsize=1)
def _pipe():
    try:
        import torch
        from transformers import pipeline
        device = 0 if torch.cuda.is_available() else -1
        return pipeline("automatic-speech-recognition", model=MODEL, device=device)
    except Exception as e:
        log.exception("ASR model load failed")
        raise ASRUnavailable(f"Could not load ASR model '{MODEL}': {e}") from e

def transcribe(y: np.ndarray, language: str) -> str:
    if language not in LANG_NAMES:
        raise ASRUnavailable(f"Language '{language}' is not configured.")
    out = _pipe()({"raw": y, "sampling_rate": 16000},
                  generate_kwargs={"language": LANG_NAMES[language], "task": "transcribe"})
    return out["text"].strip()
