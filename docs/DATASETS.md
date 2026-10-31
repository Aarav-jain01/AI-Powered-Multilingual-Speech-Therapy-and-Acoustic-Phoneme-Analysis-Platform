# Training & Evaluation Speech Datasets

| Dataset | Modality / Language | License | Intended Role |
|---|---|---|---|
| **CSLU Kids Speech** | American English, children grades K-10 | LDC Academic / Commercial License | Child acoustic baseline, phonetic forced alignment |
| **MyST (My Science Tutor)** | English, pediatric spontaneous & read speech | CC-BY 4.0 / Academic | Child acoustic modeling, high-pitch adaptation |
| **IISc IndicVoices** | 22 Indic Languages including Hindi, Tamil, Bengali | Creative Commons BY 4.0 | Indic phoneme acoustic vectors, retroflex consonants |
| **Vakyansh (AI4Bharat)** | Hindi, Tamil, Bengali speech corpus | MIT / ODC-By | Open-source Indic acoustic pretraining |
| **FLEURS** | Multilingual (English, Hindi, Tamil, Bengali, Spanish) | CC-BY 4.0 | Multilingual accent baseline & cross-lingual transfer |
| **SEP-28k & FluencyBank** | English, fluency disorders (stammering) | Academic Research License | Disfluency classification (blocks, prolongations, %SS) |
| **BoloSpeech Consented Gold Set**| Consented pediatric clinic recordings (SLP labeled)| Proprietary Clinical / Research Opt-in | Gold-standard benchmark for CI/CD model release gates |

## Acoustic Augmentation Plan for Child Speech
To overcome the sparsity of pediatric multilingual speech data:
1. **Vocal Tract Length Normalization (VTLN)**: Warping adult filterbank spectra upwards by 1.15–1.35x.
2. **Pitch Shift Augmentation**: Elevating adult F0 by 4 to 8 semitones to simulate pediatric larynx acoustics.
3. **Room Impulse Response (RIR) & Noise**: Simulating domestic living rooms, fans, and classroom noise at SNR 10dB to 25dB.
