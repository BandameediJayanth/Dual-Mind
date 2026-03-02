# DualMind — Cognitive Gaming Platform

A premium web gaming platform that analyzes how you think while you play. 10 classic games, machine learning analytics, and a cognitive performance profile that evolves with every session.

![DualMind](logo.png)

## ✨ Features

- **10 Classic Games** — Tic Tac Toe, Four in a Row, Checkers, Dots & Boxes, Memory Match, Word Chain, Ludo, Snake & Ladders, Color Wars, Sea Wars
- **ML-Powered Analytics** — Real-time skill tier prediction and performance index after every game
- **Premium UI** — Dark/light themes, Framer Motion animations, glassmorphism design
- **Scalable Backend** — FastAPI + Uvicorn handling 8K+ req/s with caching and rate limiting
- **Ethical by Design** — Non-clinical "Performance Index", no personal data, full transparency

## 🏗️ Architecture

```
React Frontend (Vite)          Python Backend (FastAPI)
┌──────────────────┐           ┌──────────────────────┐
│ GameView         │──HTTP──→  │ /api/ml/predict/skill│
│ FeatureExtractor │           │ /api/ml/predict/perf │
│ MLClient         │←─JSON──  │ ModelPool (singleton) │
│ MLProvider (ctx) │           │ TTLCache (60s)        │
└──────────────────┘           │ RateLimiter (100/min) │
                               └──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+

### Frontend
```bash
npm install
npm run dev          # → http://localhost:5173
```

### Backend (separate terminal)
```bash
cd python
python -m venv venv
.\venv\Scripts\activate    # Windows
# source venv/bin/activate # Mac/Linux
pip install -r requirements.txt
uvicorn server:app --port 8000 --reload
```

### Production Build
```bash
npm run build        # ~2-6s, zero warnings
```

## 📁 Project Structure

```
src/
├── components/          React UI (Navbar, Home, GameView, MLProvider...)
└── js/
    ├── games/           10 vanilla JS game engines
    └── ml/              MLClient, FeatureExtractor

python/
├── server.py            FastAPI backend
├── ml/                  Model classes (SkillPredictor, PerformanceEstimator)
├── models/              Trained .pkl files
└── train_models.py      Training script
```

## 🤖 ML Pipeline

```
Player plays game
  → FeatureExtractor captures: decision time, accuracy, patterns (15+ features)
  → MLClient sends features to FastAPI
  → SkillPredictor classifies: Novice → Expert (Random Forest)
  → PerformanceEstimator scores: 0-100 (Random Forest)
  → Result modal displays: skill tier badge + performance bar
```

**Current Models**: Random Forest (trained on 1000 synthetic samples)
**Planned**: LightGBM → LSTM/Transformer on real gameplay data

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Framer Motion, GSAP |
| Game Engines | Vanilla JavaScript (ES6+) |
| Backend | FastAPI, Uvicorn |
| ML | scikit-learn, NumPy, Pandas |
| Caching | In-memory TTL Cache (Redis planned) |
| Build | Vite (esbuild minifier) |

## 📊 API Docs

With the backend running, visit **http://localhost:8000/docs** for auto-generated Swagger UI.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and test: `npm run build` (must pass with zero warnings)
4. Commit: `git commit -m "feat: description"`
5. Push and create a Pull Request

See `Design Document.txt`, `Product Requirements Document (PRD).txt`, and `Technology Stack Document.txt` for full architecture details.

## 📝 License

This project is for academic and educational purposes.

## 🗺️ Roadmap

- [ ] Full gameplay data logging (per-move + per-session)
- [ ] Switch to LightGBM with probability calibration
- [ ] New features: move entropy, recovery rate, fatigue proxy
- [ ] LSTM/Transformer on move sequences (after data collection)
- [ ] Real-time multiplayer via WebSockets
- [ ] User accounts and leaderboards
