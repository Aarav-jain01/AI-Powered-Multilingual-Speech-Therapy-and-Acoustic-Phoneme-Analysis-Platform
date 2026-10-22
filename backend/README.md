# Vocalis AI backend
    pip install -r requirements.txt
    uvicorn app.main:app --reload      # docs at /docs
Set ASR_MODEL to change the model (default openai/whisper-small; downloads on first request).

## What is genuinely supported
- Audio: WAV/FLAC/OGG (content-validated). Browser MediaRecorder emits WebM/Opus, so the frontend must encode WAV before upload.
- Acoustics: MFCC, mel spectrogram, RMS, ZCR, centroid, bandwidth, rolloff, pyin pitch.
- ASR: Whisper via transformers (en, hi). Text metrics: WER/CER with word-level ops.
- Phonemes: reference lookup for a tiny en/hi lexicon ONLY. No alignment, timings, or confidence yet.
- TTS: not integrated (reported as tts=false per language).
