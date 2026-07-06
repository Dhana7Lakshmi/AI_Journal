# LifeReel AI | Cozy Memory Diary

LifeReel AI is a cozy, visual digital memory diary that automatically captures, transcribes, reframes, and illustrates your personal life entries using advanced AI integrations (FastAPI, MongoDB, Gemini, Whisper, FLUX/Stable Diffusion).

## 🚀 Key Features

* **Real Multi-User Authentication**: Hashed password storage with bcrypt, JWT token authentication, and strict per-user database isolation.
* **Smart Voice Diary**: Local Whisper-base transcription of voice recordings.
* **Generative Reframing**: Gemini NLP analyzes transcripts to extract dominant emotions, structural narratives, and artistic prompts.
* **AI Memory Art**: FLUX model automatically generates painterly illustration scenes for your memory.
* **Floating Notebook UI**: Responsive front-end constructed using high-fidelity, interactive glassmorphic theme styling.

## 🛠️ Tech Stack

- **Frontend**: Vanilla JS, Glassmorphism CSS, Vite
- **Backend**: FastAPI, Python 3.12, Uvicorn
- **Database**: MongoDB (Atlas/Local)
- **AI Integrations**: Gemini 3.1 Flash-Lite, OpenAI Whisper, HF FLUX.1-schnell

## 📂 Project Structure

```
lifereel-ai/
├── frontend/             # Vanilla JS Frontend (Vite)
│   ├── src/              # SPA Logic, Components, Router
│   ├── assets/           # Glassmorphic Theme CSS
│   └── index.html        # HTML Mounting Template
└── backend/              # FastAPI Python Backend
    ├── config/           # Database & Env Settings
    ├── models/           # Pydantic Request/Response Schemas
    ├── services/         # Whisper, Gemini, and HF image logic
    └── main.py           # Backend Entry Point
```

## ⚙️ Setup and Installation

### Backend Setup
1. Navigate to `/backend`.
2. Create a `.env` file from `.env.example`:
   ```ini
   MONGO_URI=mongodb://localhost:27017
   GEMINI_API_KEY=your_gemini_api_key
   HF_TOKEN=your_hugging_face_token
   JWT_SECRET=your_jwt_signing_secret
   JWT_ALGORITHM=HS256
   ```
3. Create a virtual environment and install packages:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
4. Start the backend:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Navigate to `/frontend`.
2. Run Vite to start the development server:
   ```bash
   npx vite
   ```
