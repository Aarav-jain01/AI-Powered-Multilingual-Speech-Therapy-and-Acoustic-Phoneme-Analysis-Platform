import re

def normalize(text: str) -> list[str]:
    return re.sub(r"[^\w\s]", "", text.lower(), flags=re.UNICODE).split()

def _align(ref, hyp):
    """Levenshtein alignment; returns ops list of (op, ref_item, hyp_item)."""
    n, m = len(ref), len(hyp)
    d = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1): d[i][0] = i
    for j in range(m + 1): d[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if ref[i - 1] == hyp[j - 1] else 1
            d[i][j] = min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + cost)
    ops, i, j = [], n, m
    while i > 0 or j > 0:
        if i and j and d[i][j] == d[i-1][j-1] + (ref[i-1] != hyp[j-1]):
            ops.append(("match" if ref[i-1] == hyp[j-1] else "substitution", ref[i-1], hyp[j-1])); i -= 1; j -= 1
        elif i and d[i][j] == d[i-1][j] + 1:
            ops.append(("deletion", ref[i-1], None)); i -= 1
        else:
            ops.append(("insertion", None, hyp[j-1])); j -= 1
    return ops[::-1]

def compare(target: str, recognized: str) -> dict:
    ref, hyp = normalize(target), normalize(recognized)
    if not ref:
        return {"wer": None, "cer": None, "word_ops": [], "status": "unavailable"}
    w_ops = _align(ref, hyp)
    wer = sum(o[0] != "match" for o in w_ops) / len(ref)
    rc, hc = list("".join(ref)), list("".join(hyp))
    cer = sum(o[0] != "match" for o in _align(rc, hc)) / max(len(rc), 1)
    return {"wer": round(wer, 4), "cer": round(cer, 4), "status": "completed",
            "word_ops": [{"op": o, "target": r, "recognized": h} for o, r, h in w_ops]}
