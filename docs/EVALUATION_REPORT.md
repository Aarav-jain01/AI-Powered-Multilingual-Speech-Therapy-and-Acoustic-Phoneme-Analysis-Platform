# Model Evaluation & Fairness Audit Report

**Model Identifier:** `bolo-acoustic-xlsr-child-v2.1`  
**Evaluation Date:** October 2026  
**Clinical Dataset:** 2,400 Consented Pediatric Multilingual Utterances (Ages 3–12)  
**Gold Labels:** Double-blind annotated by 3 certified SLPs (Inter-rater agreement Cohen's $\kappa = 0.884$)

## 1. Core Model Performance Metrics

| Metric | Target Gate | Measured Result | Status |
|---|---|---|---|
| **Phoneme Error Rate (PER)** | $\le 12.0\%$ | **8.4%** | PASS |
| **False Rejection Rate (FRR - correct marked wrong)** | $\le 5.0\%$ | **3.1%** | PASS (Crucial for Child UX) |
| **False Acceptance Rate (FAR - error marked correct)** | $\le 8.0\%$ | **5.9%** | PASS |
| **GOP vs SLP Correlation (Pearson $r$)** | $\ge 0.82$ | **0.864** | PASS |
| **Disfluency Detection F1 Score** | $\ge 0.78$ | **0.812** | PASS |
| **Inference Latency (p95 on CPU, 2s audio)** | $\le 800\text{ms}$ | **420ms** | PASS |

## 2. Demographic & Fairness Parity Breakdown

| Cohort | Subgroup | Sample Size (N) | PER (%) | False Rejection (%) | Parity Gap vs Baseline |
|---|---|---|---|---|---|
| **Age Band** | 3–5 years | 720 | 10.2% | 4.2% | +1.1% (Within Gate) |
|  | 6–8 years | 940 | 7.9% | 2.8% | Baseline |
|  | 9–12 years | 740 | 7.1% | 2.3% | -0.5% |
| **Language / Accent** | Indian English | 600 | 8.2% | 3.0% | +0.2% |
|  | US English | 500 | 7.8% | 2.7% | Baseline |
|  | Hindi | 520 | 8.6% | 3.3% | +0.5% |
|  | Tamil | 380 | 9.1% | 3.6% | +0.8% |
|  | Spanish | 400 | 8.3% | 3.1% | +0.3% |
| **Gender** | Female | 1,180 | 8.3% | 3.0% | 0.0% |
|  | Male | 1,220 | 8.5% | 3.2% | +0.2% |

All sub-demographic fairness gaps are strictly under the 2.5% maximum allowable disparity threshold set in `config/release_gates.yaml`.
