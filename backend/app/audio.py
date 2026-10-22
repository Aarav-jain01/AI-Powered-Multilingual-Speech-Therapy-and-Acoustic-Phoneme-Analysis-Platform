import io
import numpy as np, soundfile as sf, librosa

SR = 16000
MAX_BYTES, MAX_SECONDS = 10 * 1024 * 1024, 30

class AudioError(ValueError):
    pass

def decode(data: bytes) -> np.ndarray:
    if len(data) > MAX_BYTES:
        raise AudioError("File too large (max 10 MB).")
    try:  # validates real contents, not MIME type
        y, sr = sf.read(io.BytesIO(data), dtype="float32", always_2d=True)
    except Exception as e:
        raise AudioError("Could not decode audio. Supported: WAV, FLAC, OGG.") from e
    y = y.mean(axis=1)
    if len(y) == 0:
        raise AudioError("Audio is empty.")
    if len(y) / sr > MAX_SECONDS:
        raise AudioError(f"Audio longer than {MAX_SECONDS}s.")
    return librosa.resample(y, orig_sr=sr, target_sr=SR) if sr != SR else y

def quality(y: np.ndarray) -> dict:
    warnings, dur = [], len(y) / SR
    peak = float(np.max(np.abs(y)))
    clip = float(np.mean(np.abs(y) >= 0.99))
    voiced = sum(e - s for s, e in librosa.effects.split(y, top_db=35)) / len(y)
    if peak < 0.02: warnings.append("Recording is very quiet or silent.")
    if clip > 0.001: warnings.append("Clipping detected; move back from the microphone.")
    if voiced < 0.15: warnings.append("Little speech detected relative to silence.")
    if dur < 0.3: warnings.append("Recording is very short.")
    return {"valid": peak >= 0.005, "warnings": warnings, "peak": round(peak, 4),
            "clipping_ratio": round(clip, 5), "voiced_ratio": round(float(voiced), 3)}

def _down(a, n):
    idx = np.linspace(0, a.shape[-1] - 1, min(n, a.shape[-1])).astype(int)
    return a[..., idx]

def features(y: np.ndarray) -> dict:
    mfcc = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=13)
    mel = librosa.power_to_db(librosa.feature.melspectrogram(y=y, sr=SR, n_mels=64), ref=np.max)
    S = np.abs(librosa.stft(y))
    stat = lambda a: round(float(np.mean(a)), 5)
    pitch = None
    try:
        f0, _, _ = librosa.pyin(y, fmin=65, fmax=500, sr=SR)
        f0 = f0[np.isfinite(f0)]
        if len(f0): pitch = {"mean_hz": round(float(f0.mean()), 1), "median_hz": round(float(np.median(f0)), 1)}
    except Exception:
        pass
    chunks = np.array_split(y, min(400, len(y)))
    return {
        "mfcc_mean": [round(float(v), 3) for v in mfcc.mean(axis=1)],
        "rms_mean": stat(librosa.feature.rms(y=y)),
        "zcr_mean": stat(librosa.feature.zero_crossing_rate(y)),
        "spectral_centroid_mean": stat(librosa.feature.spectral_centroid(S=S, sr=SR)),
        "spectral_bandwidth_mean": stat(librosa.feature.spectral_bandwidth(S=S, sr=SR)),
        "spectral_rolloff_mean": stat(librosa.feature.spectral_rolloff(S=S, sr=SR)),
        "pitch": pitch,
        "waveform": [round(float(np.max(np.abs(c))), 4) for c in chunks],
        "mel_spectrogram_db": np.round(_down(mel, 200), 1).tolist(),
    }
