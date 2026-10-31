# ML & Speech Processing Pipeline Specification

## 1. Overview
The BoloSpeech ML service analyzes speech from multilingual children aged 3 to 12. Pediatric speech poses unique acoustic hurdles:
- Shorter vocal tract length $\to$ Higher formant frequencies (F1/F2/F3 shifted upward by 20% to 40%).
- Higher fundamental pitch (mean child F0 is 240–380 Hz vs adult 100–210 Hz).
- Articulatory variability and developmental phonological substitutions.
- Code-switching and accent variation (e.g. Indian English retroflex stops, vowel length neutralizations).

## 2. Multi-Stage Pipeline Architecture

```
Raw Audio (WAV/PCM 16kHz)
      │
      ▼
┌─────────────────────────────────┐
│ 1. Preprocessing & VAD          │
│    - Denoise (Wiener / RNNoise) │
│    - Energy/Zero-Crossing VAD   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 2. Feature Extraction           │
│    - 80-dim log-mel filterbanks │
│    - F0 Pitch Contour (YIN)     │
│    - Formant peaks (F1, F2, F3) │
│    - Spectral Centroid & VOT    │
└────────────────┬────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│ 3. Multilingual CTC Acoustic Model           │
│    - XLS-R 300M / MMS fine-tuned on child    │
│      speech with VTLN & pitch-shift aug      │
│    - Emits posterior distribution over IPA   │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│ 4. Viterbi Forced Alignment                  │
│    - Maps phoneme boundaries [start_ms, end] │
│    - Dynamic Time Warping (DTW) fallback     │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│ 5. Goodness of Pronunciation (GOP) & Scores  │
│    - Per-phoneme log-likelihood ratio vs max │
│    - Dialect & code-switch tolerance check   │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│ 6. Phonological Error & Disfluency Tagger    │
│    - Error: substitution, omission, distort  │
│    - Disfluency: %SS, prolongations, blocks  │
│    - Child-friendly feedback wording engine  │
└──────────────────────────────────────────────┘
```

## 3. Disfluency & Stammering Quantification
For children presenting with childhood-onset fluency disorder:
- **Prolongation**: Continuous acoustic voicing/frication >500ms without lexical progression.
- **Block**: Sudden cessation of acoustic energy with high intra-oral pressure and delayed release burst (>350ms).
- **Repetition**: Periodic repetition of initial consonant or syllable nucleus.
- **Percent Syllables Stuttered (%SS)**:
  $$\%SS = \frac{\text{Stuttered Syllables}}{\text{Total Syllables Spoken}} \times 100$$
All disfluency scores are labeled as "Clinician Assessment Estimate" and disfluencies do not deduct stars from the child.
