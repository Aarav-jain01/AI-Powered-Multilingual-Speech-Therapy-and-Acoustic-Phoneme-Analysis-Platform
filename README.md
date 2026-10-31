# BoloSpeech (बोलो Speech)
### Clinically-Informed Multilingual Pediatric Speech Therapy Platform

BoloSpeech is an open, clinically-supervised speech therapy platform designed for multilingual children (ages 3–12) with speech sound disorders (articulation delays, phonological disorders, stammering/fluency, and childhood apraxia of speech).

It overcomes the monolingual bias of conventional adult speech engines by providing acoustic phoneme-level feedback that accepts natural code-switching (e.g. Hindi-English "Hinglish", Tamil-English, Spanish-English), respects regional accents, and models pediatric vocal tract acoustics.

---

## 🚀 Quickstart in 5 Commands

```bash
# 1. Clone the repository
git clone https://github.com/bolospeech/bolospeech.git && cd bolospeech

# 2. Install dependencies
npm install

# 3. Verify type-safety & lint
npm run lint

# 4. Start local development server
npm run dev

# 5. Open browser at http://localhost:3000
```

---

## 🌟 Key Features

1. **Child Practice Experience (Gamified & Non-Punitive)**:
   - Word repetition, minimal pairs, picture naming, and syllable stretching.
   - Real-time Web Audio API waveform & pitch contour tracking (YIN algorithm).
   - Anatomical SVG sagittal cross-section mouth & tongue placement diagrams per phoneme.
   - Paced-speech metronome & easy-onset visualizer for stammering.
   - Syllable sequencing drills (CV $\to$ CVC $\to$ CVCV) for Childhood Apraxia of Speech (CAS).
   - Non-punitive mascot feedback with star rewards and actionable kid cues.

2. **Multilingual & Code-Switching Acceptance**:
   - Supports English (Indian, US, UK), Hindi, Tamil, Bengali, and Spanish.
   - Scoring engine accepts valid lexical alternates from the child's language set (e.g., saying "pani" or "water" are both celebrated).
   - Preserves regional dialect features (e.g. Indian English /v/-/w/ merger and retroflex stops /ʈ/, /ɖ/).

3. **Parent Dashboard & Privacy Center**:
   - Practice time, streaks, accuracy per sound, and trend graphs.
   - Plain-language weekly IEP progress report exportable to PDF.
   - Clinician-approved home practice guide.
   - Verifiable parental consent and irreversible cryptographic data purge under India's DPDP Act 2023, COPPA, and GDPR-K.

4. **Clinician (SLP) Portal**:
   - Pediatric caseload management with risk/stagnation alerts.
   - Synchronized audio player with phoneme-level boundary alignments and Goodness of Pronunciation (GOP) inspection.
   - Human-in-the-loop Gold Label override system feeding the continuous acoustic retraining loop.
   - Configurable per-child accepted dialect variants.

5. **Safety, Ethics & Governance**:
   - Clear clinical scope disclaimers: assistive home practice tool, strictly non-diagnostic.
   - Automated model release gates enforcing $\le 5\%$ False Rejection Rate and $\le 2.5\%$ Demographic Parity Gap.

---

## 📚 Complete Documentation Suite

- [Architecture & Data Flow](docs/ARCHITECTURE.md)
- [ML & Speech Processing Pipeline](docs/ML_PIPELINE.md)
- [Datasets & Acoustic Augmentations](docs/DATASETS.md)
- [Privacy & Regulatory Compliance (DPDP, COPPA, GDPR-K)](docs/PRIVACY_AND_COMPLIANCE.md)
- [Clinical Review & Developmental Norms](docs/CLINICAL_REVIEW.md)
- [REST & WebSocket API Specification](docs/API.md)
- [Adding a New Language Guide](docs/ADDING_A_LANGUAGE.md)
- [Architectural Decision Records (ADRs)](docs/DECISIONS.md)
- [Operational Runbook](docs/RUNBOOK.md)
- [Model Evaluation & Fairness Report](docs/EVALUATION_REPORT.md)
- [Model Release Gates Configuration](config/release_gates.yaml)
