# BoloSpeech System Architecture & Data Flow

## 1. High-Level System Topology

```
+---------------------------------------------------------------------------------------------------+
|                                        CLIENT TIER (React / React Native)                         |
|                                                                                                   |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+   |
|  |    Child Practice  |  |   Parent Dashboard |  |  Clinician Portal  |  |     Admin CMS      |   |
|  | - WebAudio Recorder|  | - Progress Trends  |  | - Synchronized Wave|  | - Word/IPA Bank    |   |
|  | - Tongue SVG Visual|  | - Consent Center   |  | - Gold Override    |  | - Model Registry   |   |
|  | - Pitch & Waveform |  | - PDF IEP Exporter |  | - Variant Editor   |  | - Gate Checks      |   |
|  +---------+----------+  +---------+----------+  +---------+----------+  +---------+----------+   |
|            |                       |                       |                       |              |
+------------|-----------------------|-----------------------|-----------------------|--------------+
             | WebAudio API          | HTTPS / REST          | WebSocket + REST      | HTTPS / REST
             v                       v                       v                       v
+---------------------------------------------------------------------------------------------------+
|                               API GATEWAY & CORE BACKEND (Node.js / Express / FastAPI)            |
|                                                                                                   |
|  [ Auth & RBAC ]           [ Consent Engine ]       [ Therapy Plan Manager ] [ Audit Service ]    |
|  - JWT / OIDC / MFA        - DPDP 2023 Verification - SMART Goals / Targets  - Access Logs        |
|  - Child Profile Guard     - Right-to-Erasure       - Adaptive BKT Scheduler - HIPAA / GDPR Log   |
+--------------------------------------------------+------------------------------------------------+
                                                   | Audio Buffer (PCM 16kHz)
                                                   v
+---------------------------------------------------------------------------------------------------+
|                               ACOUSTIC & ML INFERENCE ENGINE                                      |
|                                                                                                   |
|  +--------------------------+    +--------------------------+    +-----------------------------+  |
|  | Preprocessing & Clean    |    | Acoustic Feature Engine  |    | Phoneme Aligner & Scorer    |  |
|  | - VAD (Energy/Zero-Cross)| -> | - Pitch Contour (YIN)    | -> | - Forced Alignment (HMM/DTW)|  |
|  | - 16 kHz Resample & Denoise| - Formants F1/F2/F3 (LPC)  |    | - Goodness of Pronun (GOP)  |  |
|  +--------------------------+    | - Spectral Centroid/VOT  |    | - Error Classifier (gliding,|  |
|                                  +--------------------------+    |   fronting, stopping, lisp) |  |
|                                                                  +--------------+--------------+  |
|                                                                                 |                 |
|  +----------------------------------------------------------------+             |                 |
|  | Disfluency (Stammering) Detector                                |             |                 |
|  | - Block / Prolongation / Repetition / %SS Syllables Stuttered  |             |                 |
|  +----------------------------------------------------------------+             |                 |
+---------------------------------------------------------------------------------|-----------------+
                                                                                  v
                                                        [ Human-in-the-Loop Review Queue ]
                                                        - Clinician overrides -> Gold Evaluation
```

## 2. Audio Processing Pipeline Specification

1. **Client Capture**: Web Audio API `AudioContext` sampled at 44.1/48 kHz, downsampled via linear phase decimation to 16,000 Hz, 16-bit mono PCM.
2. **Real-Time Visual Buffer**: An `AnalyserNode` with FFT size 1024 streams time-domain samples to the live waveform renderer and frequency-domain bins to pitch/spectral estimation.
3. **Voice Activity Detection (VAD)**: Multi-band energy thresholding combined with spectral flatness checks prevents recording ambient noise and trims leading/trailing silence.
4. **Pitch Contour (F0)**: Extracted across 25ms Hamming-windowed frames with 10ms hop using the YIN autocorrelation algorithm, calibrated for children's typical higher fundamental frequency (200 Hz–450 Hz).
5. **Formant & Spectral Analysis**:
   - Vowels & /r/: F1, F2, and F3 estimated via Linear Predictive Coding (LPC) filter roots. /r/ precision specifically tracks F3 dip below 2500 Hz.
   - Sibilants (/s/ vs /ʃ/): Spectral centroid calculation (differentiates high-frequency frontal /s/ at ~5.5–8 kHz vs postalveolar /ʃ/ at ~3.5–4.5 kHz).
   - Stops (/p/, /b/, /t/, /d/, /k/, /g/): Voice Onset Time (VOT) and burst spectral shape.
6. **Goodness of Pronunciation (GOP)**:
   $$\text{GOP}(p) = \frac{1}{|T|} \left[ \log P(O | p) - \max_{q \in \mathcal{P}} \log P(O | q) \right]$$
   Evaluates target phoneme likelihood against competing phonemes, normalized against child-specific acoustic baseline.
7. **Error Classification Rules**:
   - Gliding: Target /r/ or /l/ recognized as /w/ or /j/ (F3 fails to drop).
   - Fronting: Target velar /k/, /g/ realized as alveolar /t/, /d/.
   - Stopping: Target fricative /s/, /f/, /θ/ realized as stop /t/, /p/.
   - Lisp: Frontal (tongue protrusion) or lateral (air escape over sides of tongue).
