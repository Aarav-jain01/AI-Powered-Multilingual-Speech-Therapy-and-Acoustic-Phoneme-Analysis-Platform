# Privacy, Data Governance & Regulatory Compliance

## 1. Regulatory Frameworks
BoloSpeech is designed in strict compliance with:
- **India Digital Personal Data Protection (DPDP) Act 2023**: Section 9 mandates verifiable parental consent before processing any personal data of a child. Prohibits behavioral monitoring, tracking, or targeted advertising directed at children.
- **Children's Online Privacy Protection Act (COPPA - 16 CFR Part 312)**: Direct notice to parents, verifiable consent mechanisms, reasonable data retention limits, and unconditional right to review and delete child voice recordings.
- **General Data Protection Regulation (GDPR-K / Article 8)**: Processing lawful only where child is at least 16 (or national lower age down to 13) with parental authorization. Right to be forgotten (Article 17).
- **HIPAA Privacy & Security Rules (45 CFR Part 160/164)**: Audio and clinical notes protected as Electronic Protected Health Information (ePHI) when managed within healthcare provider agreements.

## 2. Voice Biometrics & Data Minimization
- **Biometric Minimization**: Raw audio is not retained indefinitely. The system provides an automated rolling retention window (default 30 days), after which raw audio is securely deleted, preserving only de-identified acoustic score vectors unless explicitly pinned by an SLP for clinical progress tracking.
- **Cryptographic Right-to-Erasure**: When a parent executes "Delete My Child's Data" from the Privacy Center:
  1. All stored WAV/PCM audio buffers are immediately unlinked and securely wiped from object storage.
  2. All derived phoneme alignment matrices and trial records are hard-deleted.
  3. An immutable audit record is logged recording timestamp, parent ID, and erasure confirmation hash.
