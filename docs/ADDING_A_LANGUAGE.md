# Adding a New Language to BoloSpeech

Adding a new language is purely a declarative configuration and dataset process:

1. **Create Phoneme Configuration (`config/phonemes/<lang_code>.json`)**:
   - Define IPA inventory with articulatory properties (place, manner, voicing, aspiration, retroflexion).
   - Define developmental age acquisition milestones.
   - Configure dialectal variants and acceptable substitutions (e.g., regional rhotics, aspirates).
2. **Configure Grapheme-to-Phoneme (G2P) Table**:
   - Provide rule set or pronunciation lexicon mapping native orthography $\to$ IPA strings.
3. **Populate Seed Word & Phrase Bank (`content/<lang_code>/`)**:
   - Minimum 200 words across target sounds in initial, medial, and final positions.
   - Include syllable shape tags (`CV`, `CVC`, `CCVC`, etc.).
   - Associate child-friendly illustration metadata and native audio model references.
4. **Register Language in Registry (`src/data/languages.ts`)**:
   - Set display name, script direction (LTR/RTL), default font families, and code-switch pairing mappings.
5. **Run Evaluation Regression Gate**:
   - Run synthetic audio fixtures through `tests/acoustic_evaluation.test.ts` to ensure False Rejection Rate $\le 5\%$ and Phoneme Error Rate $\le 12\%$.
