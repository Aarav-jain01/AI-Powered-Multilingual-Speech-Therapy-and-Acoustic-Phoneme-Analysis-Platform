"""Reference phoneme lookup only. NO forced alignment or learner-phoneme detection yet.
English: ARPAbet (CMUdict-style). Hindi: IPA. Tiny hand-written vocabulary."""
LEXICON = {
    "en": {"rabbit": ["R", "AE", "B", "IH", "T"], "water": ["W", "AO", "T", "ER"],
           "think": ["TH", "IH", "NG", "K"], "ship": ["SH", "IH", "P"],
           "sheep": ["SH", "IY", "P"], "red": ["R", "EH", "D"]},
    "hi": {"नमस्ते": ["n", "ə", "m", "ə", "s", "t", "eː"], "पानी": ["p", "aː", "n", "iː"],
           "किताब": ["k", "i", "t", "aː", "b"], "धन्यवाद": ["dʱ", "ə", "n", "j", "ə", "ʋ", "aː", "d"]},
}

def analyze(language: str, text: str) -> dict:
    words, found, missing = text.lower().split(), [], []
    for w in words:
        p = LEXICON.get(language, {}).get(w)
        (found if p else missing).append({"word": w, "phonemes": p} if p else w)
    return {
        "status": "reference_only" if found else "unavailable",
        "reference": found, "unknown_words": missing,
        "learner_phonemes": None, "timings": None, "confidence": None,
        "note": "Reference phonemes only. Alignment/confidence need a forced aligner "
                "(e.g. MFA) or a trained phoneme model; none is integrated yet.",
    }
