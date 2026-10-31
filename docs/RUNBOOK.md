# BoloSpeech Operational Runbook & Production Deployment

## 1. Quickstart (Development Mode)
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Compile & typecheck
npm run lint
npm run build
```

## 2. Docker & Full-Stack Deployment
```yaml
# docker-compose.yml summary
services:
  web:
    build: .
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
  speech-inference:
    image: bolospeech/acoustic-engine:v1.4.0
    ports: ["8000:8000"]
    deploy:
      resources:
        limits:
          cpus: "4.0"
          memory: 4096M
```

## 3. Disaster Recovery & Failure Modes
- **Audio Service Latency >2s**: Automatically fall back to asynchronous queued scoring; notify child: "Awesome recording saved! Let's play the next word while Boloo listens."
- **Microphone Hardware Failure**: Prompt browser permission repair modal with one-click audio test oscillator.
- **Data Purge Request**: Trigger transactional hard-purge job within 60 seconds; log hashed DPDP compliance receipt.
