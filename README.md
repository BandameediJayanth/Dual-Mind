# 🧠 Dual Mind

<p align="center">
  <img src="src/assets/images/logo.png" alt="Dual Mind Logo" width="150">
</p>

<p align="center">
  <strong>Where Human Intelligence Meets Machine Learning</strong>
</p>

<p align="center">
  A collection of 10 classic games with ML-driven performance monitoring
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-ES6+-yellow.svg" alt="JavaScript"></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.9+-blue.svg" alt="Python"></a>
</p>

---

## 📋 Overview

**Dual Mind** represents the duality between human cognition and artificial intelligence. The logo symbolizes this fusion - the human side (orange/red) representing natural intelligence, and the AI side (blue) representing machine learning analysis.

This browser-based multiplayer game suite features 10 classic games with integrated machine learning to track and analyze player performance. The system generates a "Performance Index" (non-clinical) based on gameplay patterns.

## 🎯 Features

- **10 Classic Games**: Tic-Tac-Toe, Connect Four, Checkers, Dots & Boxes, Memory Match, Word Chain, Game 24, Mini Sudoku, Ludo, Reversi
- **Performance Tracking**: Real-time cognitive metrics including response time, accuracy, and strategic depth
- **ML-Powered Insights**: Skill tier prediction and performance trends using Random Forest and XGBoost
- **Responsive Design**: Works on desktop and mobile browsers
- **Privacy-First**: All data stored locally, with user consent controls
- **Accessible**: ARIA labels, keyboard navigation, high-contrast themes

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Browser UI    │────▶│  Python ML API  │
│   (JavaScript)  │◀────│  (Flask/sklearn)│
└─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Local Storage  │     │  ML Models      │
│  (IndexedDB)    │     │  (.joblib)      │
└─────────────────┘     └─────────────────┘
```

**Key Design Decisions:**
- JavaScript handles all game logic, UI, and feature extraction
- Python handles all ML training and inference (no ML in JS)
- REST API communication between frontend and ML server

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### ML Server Setup

```bash
# Navigate to python directory
cd python

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Train models (generates synthetic data)
python train_models.py

# Start ML API server
python api_server.py
```

### Running Tests

```bash
# JavaScript tests
npm test

# Python tests
cd python
pytest
```

## 📁 Project Structure

```
├── src/
│   ├── css/                 # Stylesheets
│   ├── js/
│   │   ├── core/           # EventBus, GameController, StorageManager
│   │   ├── games/          # 10 game engines
│   │   ├── ml/             # Feature extraction, ML client
│   │   └── ui/             # Dashboard, UI components
│   └── assets/             # Images, sounds
├── python/
│   ├── ml/                 # ML models and processors
│   ├── api_server.py       # Flask REST API
│   └── train_models.py     # Model training script
├── tests/                  # Jest test files
├── docs/                   # Documentation
├── index.html              # Entry point
├── package.json            # Node dependencies
└── vite.config.js          # Build configuration
```

## 🎮 Games Included

| Game | Players | Difficulty | Skills Measured |
|------|---------|------------|-----------------|
| Tic-Tac-Toe | 2 | Easy | Pattern recognition |
| Four in a Row | 2 | Medium | Spatial reasoning |
| Checkers | 2 | Medium | Tactical thinking |
| Dots & Boxes | 2 | Easy | Strategic timing |
| Memory Match | 1-2 | Easy | Short-term memory |
| Word Chain | 2+ | Medium | Vocabulary, speed |
| Sea Wars | 2 | Medium | Stategic planning |
| Snake & Ladders | 2 | Easy | Probability & Risk |
| Color Wars | 2 | Medium | Strategic expansion |
| Ludo | 2-4 | Easy | Risk assessment |

## 📊 Performance Metrics

The system tracks:
- **Response Time**: Decision speed per move
- **Move Accuracy**: Optimal vs. suboptimal choices
- **Consistency**: Performance stability across sessions
- **Improvement Rate**: Learning curve over time

### Skill Tiers

| Tier | Score | Description |
|------|-------|-------------|
| 🟤 Novice | 0-20 | Just getting started |
| 🟢 Beginner | 21-40 | Learning basics |
| 🔵 Intermediate | 41-60 | Good skills |
| 🟣 Advanced | 61-80 | Strong player |
| 🟠 Expert | 81-100 | Exceptional |

## ⚠️ Important Disclaimer

**This is NOT a clinical IQ test.** The Performance Index is an entertainment-focused metric designed to track gameplay performance. It should not be used for any diagnostic, academic, or professional purposes.

## 🔒 Privacy

- All gameplay data is stored locally on your device
- No data is sent to external servers (except the local ML API)
- Users can export or delete their data at any time
- Consent is requested before any data collection

## 🛠️ API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ml/health` | GET | Check server status |
| `/api/ml/predict/skill` | POST | Get skill tier prediction |
| `/api/ml/predict/performance` | POST | Get performance index |
| `/api/ml/analyze/trends` | POST | Analyze session trends |

## 📚 Documentation

- [User Guide](docs/USER_GUIDE.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [TODO List](TODO.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Classic game rules from various sources
- scikit-learn and XGBoost for ML models
- Vite for fast development experience
