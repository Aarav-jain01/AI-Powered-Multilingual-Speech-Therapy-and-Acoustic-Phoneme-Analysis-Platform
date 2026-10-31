# REST & WebSocket API Specification (v1)

## 1. Authentication & Security
- Scheme: `Bearer <JWT_TOKEN>` with MFA validation for clinician and parent profiles.
- Role-Based Access Control: `role: ["child", "parent", "clinician", "admin"]`.

## 2. Core Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/parent/consent` | Record verified parental consent under DPDP/COPPA |
| `GET` | `/api/v1/children` | List children linked to authenticated guardian |
| `POST` | `/api/v1/children` | Register child profile with multilingual profile & DOB |
| `DELETE` | `/api/v1/children/:id/data` | Cryptographic hard-purge of all child audio & records |
| `GET` | `/api/v1/exercises/adaptive-next`| Fetch next stimulus using BKT knowledge tracing |
| `POST` | `/api/v1/speech/analyze` | Multipart PCM audio upload $\to$ GOP scores & error types |
| `WS` | `/ws/v1/speech/stream` | Real-time WebSocket streaming for continuous phoneme alignment |
| `GET` | `/api/v1/clinician/caseload` | SLP caseload summary, risk flags, active plans |
| `POST` | `/api/v1/clinician/override` | Commit human correction to model training queue |
| `GET` | `/api/v1/reports/:childId/weekly`| Generate clinical IEP progress summary |
| `GET` | `/api/v1/admin/model-registry` | Model registry versions, fairness parity & release gates |

## 3. Sample Attempt Payload & Response

```json
// POST /api/v1/speech/analyze (Response)
{
  "attemptId": "att_8941fbc8",
  "targetWord": "rabbit",
  "targetIPA": "ɹ æ b ɪ t",
  "recognizedIPA": "w æ b ɪ t",
  "overallGOP": 0.68,
  "confidence": 0.89,
  "phonemes": [
    {
      "phoneme": "ɹ",
      "position": "initial",
      "gop": 0.38,
      "status": "error",
      "errorType": "gliding",
      "substitutedWith": "w",
      "formants": { "F1": 420, "F2": 1150, "F3": 2840 },
      "acousticNote": "F3 did not lower below 2500Hz; rounded lip acoustics detected"
    },
    { "phoneme": "æ", "position": "medial", "gop": 0.94, "status": "correct" },
    { "phoneme": "b", "position": "medial", "gop": 0.91, "status": "correct" },
    { "phoneme": "ɪ", "position": "medial", "gop": 0.88, "status": "correct" },
    { "phoneme": "t", "position": "final", "gop": 0.92, "status": "correct" }
  ],
  "disfluency": {
    "detected": false,
    "percentSyllablesStuttered": 0.0,
    "prolongationsCount": 0,
    "blocksCount": 0
  },
  "childFeedback": "Super try! Can you make your tongue curl back like a spoon for the /r/ sound?",
  "clinicianReviewFlag": false
}
```
