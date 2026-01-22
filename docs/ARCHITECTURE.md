# Dual Mind - System Architecture Overview

<p align="center">
  <img src="../src/assets/images/logo.svg" alt="Dual Mind Logo" width="100">
</p>

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER ENVIRONMENT                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │
│  │   UI Layer  │  │ Game Canvas  │  │     Dashboard/Analytics    │  │
│  └──────┬──────┘  └──────┬───────┘  └─────────────┬──────────────┘  │
│         │                │                        │                  │
│  ┌──────▼────────────────▼────────────────────────▼──────────────┐  │
│  │                    Core Controller Layer                       │  │
│  │  ┌─────────────┐  ┌────────────┐  ┌────────────────────────┐  │  │
│  │  │  EventBus   │  │GameController│  │    UIManager         │  │  │
│  │  └─────────────┘  └────────────┘  └────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                │                                     │
│  ┌─────────────────────────────▼─────────────────────────────────┐  │
│  │                     Game Engine Layer                          │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │TicTac  │ │FourIn  │ │Checkers│ │Dots&   │ │Memory  │       │  │
│  │  │Toe     │ │ARow    │ │        │ │Boxes   │ │Match   │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │Word    │ │Game24  │ │Mini    │ │Ludo    │ │Reversi │       │  │
│  │  │Chain   │ │        │ │Sudoku  │ │        │ │        │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                │                                     │
│  ┌─────────────────────────────▼─────────────────────────────────┐  │
│  │                    Data & ML Layer                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │
│  │  │FeatureExtract│  │  MLClient    │  │ Analytics Engine    │  │  │
│  │  └──────────────┘  └──────┬───────┘  └─────────────────────┘  │  │
│  └───────────────────────────┼───────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────▼───────────────────────────────────┐  │
│  │                   Storage Layer                                │  │
│  │  ┌──────────────┐  ┌──────────────────────────────────────┐   │  │
│  │  │ LocalStorage │  │           IndexedDB                   │   │  │
│  │  │ (Preferences)│  │  (Sessions, Features, Predictions)    │   │  │
│  │  └──────────────┘  └──────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ REST API (JSON)
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PYTHON ML SERVER                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     Flask API Server                          │   │
│  │  /api/ml/predict/skill    /api/ml/predict/performance         │   │
│  │  /api/ml/analyze/trends   /api/ml/predict/batch               │   │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────▼───────────────────────────────────┐  │
│  │                     ML Processing                              │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐   │  │
│  │  │FeatureProcess│  │SkillPredictor │  │PerformanceEstimate│   │  │
│  │  └──────────────┘  │(RandomForest) │  │   (XGBoost)       │   │  │
│  │                    └───────────────┘  └───────────────────┘   │  │
│  │  ┌───────────────────────────────────────────────────────┐    │  │
│  │  │                 TrendAnalyzer                          │    │  │
│  │  │            (Session Pattern Analysis)                  │    │  │
│  │  └───────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────▼───────────────────────────────────┐  │
│  │                   Model Storage                                │  │
│  │            models/skill_predictor.joblib                       │  │
│  │            models/performance_estimator.joblib                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### Browser Layer

#### UI Layer
- **Main HTML/CSS**: Responsive layout with CSS custom properties for theming
- **Theme Support**: Light, dark, and high-contrast modes
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

#### Core Controller Layer
- **EventBus**: Pub/sub pattern for decoupled communication
- **GameController**: Manages game lifecycle, player turns, state transitions
- **UIManager**: Handles DOM updates, modal dialogs, notifications

#### Game Engine Layer
Each game implements the `BaseGame` interface:
- `init()`: Initialize game state
- `validateMove(move)`: Check if a move is legal
- `makeMove(move)`: Execute a move and update state
- `checkGameOver()`: Determine win/loss/draw conditions
- `render(canvas)`: Draw the game board

#### Data & ML Layer
- **FeatureExtractor**: Extracts cognitive features from gameplay (timing, accuracy, patterns)
- **MLClient**: Sends feature vectors to Python ML server, handles fallback
- **AnalyticsEngine**: Aggregates session data, calculates metrics

#### Storage Layer
- **LocalStorage**: User preferences, theme settings, consent status
- **IndexedDB**: Session history, feature vectors, ML predictions

### Python ML Server

#### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ml/health` | GET | Service availability check |
| `/api/ml/predict/skill` | POST | Predict skill tier (Novice→Expert) |
| `/api/ml/predict/performance` | POST | Estimate performance index (0-100) |
| `/api/ml/analyze/trends` | POST | Analyze session trends |
| `/api/ml/predict/batch` | POST | Batch predictions for efficiency |

#### ML Models
- **SkillPredictor**: Random Forest Classifier (5 skill tiers)
- **PerformanceEstimator**: XGBoost Regressor (0-100 score)
- **TrendAnalyzer**: Statistical analysis of session patterns

## Data Flow

### Gameplay Session
```
1. User selects game → GameController.startGame()
2. Game initializes → BaseGame.init()
3. User makes move → InputHandler detects click/tap
4. Controller validates → Game.validateMove()
5. Move executed → Game.makeMove()
6. FeatureExtractor captures timing, accuracy
7. Game state updated → Game.checkGameOver()
8. UI re-rendered → Game.render()
9. Repeat until game over
```

### ML Prediction Flow
```
1. Session ends → AnalyticsEngine.endSession()
2. Features aggregated → FeatureExtractor.extract()
3. Features sent → MLClient.predictSkillTier()
4. REST call → Python /api/ml/predict/skill
5. Model inference → SkillPredictor.predict()
6. Result returned → {tier, confidence, explanation}
7. Stored locally → StorageManager.savePrediction()
8. Dashboard updated → Dashboard.update()
```

## Key Design Decisions

### 1. Separation of ML from Frontend
- **Rationale**: ML models require scientific computing libraries (scikit-learn, XGBoost)
- **Implementation**: REST API communication between JS frontend and Python backend
- **Fallback**: Rule-based estimates when Python server unavailable

### 2. Event-Driven Architecture
- **Rationale**: Loose coupling, easy testing, extensibility
- **Implementation**: EventBus with priority queues and history tracking

### 3. BaseGame Abstract Class
- **Rationale**: Consistent interface for all 10 games
- **Implementation**: Shared lifecycle methods, unified feature extraction

### 4. Local-First Storage
- **Rationale**: Privacy, offline capability, no server dependency for core features
- **Implementation**: IndexedDB for structured data, LocalStorage for preferences

### 5. Ethical ML Labels
- **Rationale**: Avoid clinical IQ implications
- **Implementation**: "Performance Index" instead of "IQ", clear disclaimers

## File Structure

```
src/
├── css/
│   ├── main.css          # Core styles, CSS variables
│   ├── components.css    # UI component styles
│   ├── games.css         # Game-specific styles
│   └── dashboard.css     # Dashboard and modal styles
├── js/
│   ├── main.js           # Application entry point
│   ├── core/
│   │   ├── EventBus.js
│   │   ├── GameController.js
│   │   ├── UIManager.js
│   │   ├── StorageManager.js
│   │   ├── InputHandler.js
│   │   ├── AnimationManager.js
│   │   ├── ConsentManager.js
│   │   └── index.js
│   ├── games/
│   │   ├── BaseGame.js
│   │   ├── TicTacToe.js
│   │   ├── FourInARow.js
│   │   ├── Checkers.js
│   │   ├── DotsAndBoxes.js
│   │   ├── MemoryMatch.js
│   │   ├── WordChain.js
│   │   ├── Game24.js
│   │   ├── MiniSudoku.js
│   │   ├── Ludo.js
│   │   ├── Reversi.js
│   │   └── index.js
│   ├── ml/
│   │   ├── FeatureExtractor.js
│   │   ├── MLClient.js
│   │   └── index.js
│   ├── analytics/
│   │   └── AnalyticsEngine.js
│   └── ui/
│       ├── Dashboard.js
│       └── index.js
python/
├── api_server.py         # Flask REST API
├── train_models.py       # Model training script
├── requirements.txt
└── ml/
    ├── __init__.py
    ├── feature_processor.py
    ├── skill_predictor.py
    ├── performance_estimator.py
    └── trend_analyzer.py
tests/
├── setup.js              # Jest configuration
├── games/
│   ├── TicTacToe.test.js
│   └── FourInARow.test.js
└── core/
    └── EventBus.test.js
docs/
├── ARCHITECTURE.md       # This file
└── USER_GUIDE.md        # User documentation
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| UI Rendering | Canvas API, DOM manipulation |
| State Management | Custom EventBus, finite state machines |
| Storage | LocalStorage, IndexedDB |
| Backend | Python 3.9+, Flask |
| ML Models | scikit-learn, XGBoost |
| Communication | REST API (JSON) |
| Testing | Jest (JS), pytest (Python) |
