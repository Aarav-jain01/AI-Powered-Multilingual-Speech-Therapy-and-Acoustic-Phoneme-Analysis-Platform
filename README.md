# Vocalis AI
Terminal 1:  cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload
Terminal 2:  cd frontend && npm install && npm run dev      # http://localhost:5173 (proxies /api to :8000)
First analysis downloads openai/whisper-small (~1 GB). Set ASR_MODEL=openai/whisper-tiny for a faster demo.
Mic access needs localhost or HTTPS. See backend/README.md for what is and is not supported.
"# AI-Powered-Multilingual-Speech-Therapy-and-Acoustic-Phoneme-Analysis-Platform" 
