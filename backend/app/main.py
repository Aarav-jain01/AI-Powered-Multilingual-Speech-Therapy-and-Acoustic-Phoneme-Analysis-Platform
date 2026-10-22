import json, uuid, logging, datetime as dt
from collections import Counter
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from . import audio, asr, metrics, phonemes
from .db import Base, engine, get_db, PracticeSession
from .exercises import EXERCISES

logging.basicConfig(level=logging.INFO)
Base.metadata.create_all(engine)
app = FastAPI(title="Vocalis AI")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_methods=["*"], allow_headers=["*"])
LANGS = [{"code": "en", "name": "English", "asr": True, "reference_phonemes": True, "tts": False},
         {"code": "hi", "name": "Hindi", "asr": True, "reference_phonemes": True, "tts": False}]

async def _load(file: UploadFile):
    try:
        return audio.decode(await file.read())
    except audio.AudioError as e:
        raise HTTPException(422, str(e))

def _asr(y, language):
    try:
        return asr.transcribe(y, language)
    except asr.ASRUnavailable as e:
        raise HTTPException(503, str(e))

@app.get("/api/health")
def health():
    return {"status": "ok", "asr_model": asr.MODEL}

@app.get("/api/languages")
def languages():
    return LANGS

@app.get("/api/exercises")
def exercises(language: Optional[str] = None, difficulty: Optional[str] = None, q: Optional[str] = None):
    return [e for e in EXERCISES if (not language or e["language"] == language)
            and (not difficulty or e["difficulty"] == difficulty) and (not q or q.lower() in e["text"].lower())]

@app.post("/api/speech-recognition")
async def speech_recognition(language: str = Form("en"), file: UploadFile = File(...)):
    return {"language": language, "text": _asr(await _load(file), language), "model": asr.MODEL}

class PhonemeReq(BaseModel):
    language: str
    text: str

@app.post("/api/phoneme-analysis")
def phoneme_analysis(req: PhonemeReq):
    return phonemes.analyze(req.language, req.text)

def _feedback(q, cmp, ph):
    fb = list(q["warnings"])
    if cmp["status"] == "unavailable":
        fb.append("No target text given, so no text comparison was made.")
        return fb
    for o in cmp["word_ops"]:
        if o["op"] == "substitution": fb.append(f"Target '{o['target']}' was recognized as '{o['recognized']}'. Repeat this word slowly.")
        elif o["op"] == "deletion": fb.append(f"'{o['target']}' was not recognized.")
        elif o["op"] == "insertion": fb.append(f"Extra word recognized: '{o['recognized']}'.")
    if cmp["wer"] == 0: fb.append("Recognized text matches the target.")
    fb.append("Mismatches can come from accent, noise, or recognizer errors, not only pronunciation. "
              "This is practice feedback, not a diagnosis.")
    return fb

@app.post("/api/analyze-audio")
async def analyze_audio(language: str = Form("en"), target_text: str = Form(""), file: UploadFile = File(...)):
    y = await _load(file)
    q = audio.quality(y)
    feats = audio.features(y)
    recognized, status = None, "completed"
    if q["valid"]:
        recognized = _asr(y, language)
    else:
        status = "failed_invalid_audio"
    cmp = metrics.compare(target_text, recognized) if (target_text.strip() and recognized is not None) \
        else {"wer": None, "cer": None, "status": "unavailable", "word_ops": []}
    ph = phonemes.analyze(language, target_text) if target_text.strip() else None
    return {"session_id": uuid.uuid4().hex, "language": language, "target_text": target_text or None,
            "recognized_text": recognized, "duration_seconds": round(len(y) / audio.SR, 2),
            "audio_quality": q, "acoustic_features": feats, "phonemes": ph,
            "text_comparison": cmp, "feedback": _feedback(q, cmp, ph), "analysis_status": status}

class SessionIn(BaseModel):
    session_id: str
    language: str
    target_text: Optional[str] = None
    recognized_text: Optional[str] = None
    duration_seconds: float = 0
    text_comparison: dict = {}
    model_config = {"extra": "allow"}

@app.post("/api/practice-sessions", status_code=201)
def save_session(s: SessionIn, db: Session = Depends(get_db)):
    db.merge(PracticeSession(id=s.session_id, language=s.language, target_text=s.target_text,
             recognized_text=s.recognized_text, duration_seconds=s.duration_seconds,
             wer=s.text_comparison.get("wer"), cer=s.text_comparison.get("cer"),
             result_json=json.dumps(s.model_dump())))
    db.commit()
    return {"session_id": s.session_id}

@app.get("/api/practice-sessions")
def list_sessions(language: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db)):
    qs = db.query(PracticeSession).order_by(PracticeSession.created_at.desc())
    if language: qs = qs.filter_by(language=language)
    return [{"session_id": r.id, "created_at": r.created_at.isoformat(), "language": r.language,
             "target_text": r.target_text, "recognized_text": r.recognized_text,
             "duration_seconds": r.duration_seconds, "wer": r.wer} for r in qs.limit(limit)]

@app.get("/api/practice-sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    r = db.get(PracticeSession, session_id)
    if not r: raise HTTPException(404, "Session not found")
    return json.loads(r.result_json)

@app.delete("/api/practice-sessions")
def delete_sessions(db: Session = Depends(get_db)):
    n = db.query(PracticeSession).delete(); db.commit()
    return {"deleted": n}

@app.get("/api/progress")
def progress(db: Session = Depends(get_db)):
    rows = db.query(PracticeSession).order_by(PracticeSession.created_at).all()
    by_lang = {}
    for r in rows:
        d = by_lang.setdefault(r.language, {"sessions": 0, "wers": []})
        d["sessions"] += 1
        if r.wer is not None: d["wers"].append(r.wer)
    return {"total_sessions": len(rows),
            "total_practice_seconds": round(sum(r.duration_seconds or 0 for r in rows), 1),
            "languages": {k: {"sessions": v["sessions"],
                              "mean_wer": round(sum(v["wers"]) / len(v["wers"]), 3) if v["wers"] else None}
                          for k, v in by_lang.items()},
            "frequent_words": Counter(r.target_text for r in rows if r.target_text).most_common(10),
            "trend": [{"date": r.created_at.date().isoformat(), "wer": r.wer} for r in rows if r.wer is not None],
            "score_definition": "WER = (substitutions + deletions + insertions) / target words. Lower is better. "
                                "It measures text mismatch from the recognizer, not clinical pronunciation quality."}
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/")
    def index():
        return FileResponse(DIST / "index.html")