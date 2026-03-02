import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useML } from './MLProvider';

// Import original vanilla JS game engines
import { TicTacToe } from '../js/games/TicTacToe';
import { Checkers } from '../js/games/Checkers';
import { FourInARow } from '../js/games/FourInARow';
import { DotsAndBoxes } from '../js/games/DotsAndBoxes';
import { MemoryMatch } from '../js/games/MemoryMatch';
import { WordChain } from '../js/games/WordChain';
import { Ludo } from '../js/games/Ludo';
import { ColorWars } from '../js/games/ColorWars';
import { SeaWars } from '../js/games/SeaWars';
import { SnakeAndLadders } from '../js/games/SnakeAndLadders';
import './GameView.css';

const GAME_MAP = {
  tictactoe:      { Engine: TicTacToe,      name: 'Tic Tac Toe',      icon: '❌' },
  fourinarow:     { Engine: FourInARow,      name: 'Four in a Row',    icon: '🔴' },
  checkers:       { Engine: Checkers,        name: 'Checkers',         icon: '♟️' },
  dotsandboxes:   { Engine: DotsAndBoxes,    name: 'Dots & Boxes',     icon: '🔲' },
  memorymatch:    { Engine: MemoryMatch,     name: 'Memory Match',     icon: '🧠' },
  wordchain:      { Engine: WordChain,       name: 'Word Chain',       icon: '🔤' },
  ludo:           { Engine: Ludo,            name: 'Ludo',             icon: '🎲' },
  snakeandladders:{ Engine: SnakeAndLadders, name: 'Snake & Ladders',  icon: '🐍' },
  colorwars:      { Engine: ColorWars,       name: 'Color Wars',       icon: '🎨' },
  seawars:        { Engine: SeaWars,         name: 'Sea Wars',         icon: '🚢' },
};

// Skill tier colors for visual feedback
const TIER_COLORS = {
  Novice: '#94a3b8',
  Beginner: '#22c55e',
  Intermediate: '#3b82f6',
  Advanced: '#a855f7',
  Expert: '#f59e0b',
};

export default function GameView({ gameId, onBack }) {
  const boardRef = useRef(null);
  const gameRef = useRef(null);
  const [gameResult, setGameResult] = useState(null);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // ML hooks from context
  const { startSession, recordMove, endSessionAndPredict, mlStatus } = useML();

  useEffect(() => {
    if (!boardRef.current || !gameId) return;

    const gameDef = GAME_MAP[gameId];
    if (!gameDef) return;

    // Reset state
    setGameResult(null);
    setMlPrediction(null);

    // Start ML feature extraction session
    startSession(gameId);

    // Create event bus
    const eventBus = {
      _handlers: {},
      on(evt, fn) {
        if (!this._handlers[evt]) this._handlers[evt] = [];
        this._handlers[evt].push(fn);
      },
      off(evt, fn) {
        if (this._handlers[evt]) {
          this._handlers[evt] = this._handlers[evt].filter(h => h !== fn);
        }
      },
      emit(evt, ...args) {
        (this._handlers[evt] || []).forEach(fn => {
          try { fn(...args); } catch(e) { console.error(e); }
        });
      }
    };

    // Listen for move events to record in FeatureExtractor
    eventBus.on('game:move', (moveData) => {
      recordMove(moveData || {});
    });

    // Listen for game end
    eventBus.on('game:end', async (data) => {
      console.log('🏆 Game ended:', data);
      setGameResult(data);
      setShowResultModal(true);

      // Run ML prediction pipeline
      setMlLoading(true);
      try {
        const prediction = await endSessionAndPredict(data);
        if (prediction) {
          setMlPrediction(prediction);
          console.log('🤖 ML Prediction:', prediction);
        }
      } catch (err) {
        console.error('ML prediction failed:', err);
      }
      setMlLoading(false);
    });

    const startGame = async () => {
      try {
        const game = new gameDef.Engine(eventBus);
        gameRef.current = game;
        await game.init();
        game.render(null, boardRef.current);
        console.log(`🎮 ${gameDef.name} loaded`);
      } catch (err) {
        console.error(`Failed to start ${gameDef.name}:`, err);
        boardRef.current.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Failed to load game. Please try again.</p>`;
      }
    };

    startGame();

    return () => {
      if (gameRef.current && gameRef.current.cleanup) {
        gameRef.current.cleanup();
      }
      if (boardRef.current) {
        boardRef.current.innerHTML = '';
      }
      gameRef.current = null;
    };
  }, [gameId]);

  const handlePlayAgain = () => {
    setGameResult(null);
    setMlPrediction(null);
    setShowResultModal(false);

    // Restart ML session
    startSession(gameId);

    if (gameRef.current && boardRef.current) {
      gameRef.current.init().then(() => {
        gameRef.current.render(null, boardRef.current);
      });
    }
  };

  const handleQuit = () => {
    setGameResult(null);
    setMlPrediction(null);
    setShowResultModal(false);
    onBack();
  };

  const gameDef = GAME_MAP[gameId];
  if (!gameDef) return <p>Unknown game: {gameId}</p>;

  return (
    <motion.div
      className="game-view-container container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="game-view-header">
        <button className="btn-back" onClick={onBack}>
          <span className="arrow">←</span> Back to Games
        </button>
        <div className="game-title-header">
          <span className="game-icon">{gameDef.icon}</span>
          <h2>{gameDef.name}</h2>
          {/* ML status indicator */}
          <span className={`ml-badge-small ${mlStatus.pythonService ? 'ml-connected' : 'ml-fallback'}`}>
            {mlStatus.pythonService ? '🤖 ML' : '📐 Rule'}
          </span>
        </div>
      </div>

      <div className="game-board-wrapper">
        <div ref={boardRef} className="game-board-mount-point" id="game-board-container" />
      </div>

      {/* ============ GAME RESULT MODAL ============ */}
      <AnimatePresence>
        {gameResult && showResultModal && (
          <motion.div
            className="result-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="result-modal"
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <button className="btn-close-modal" onClick={() => setShowResultModal(false)} aria-label="Close">✖</button>
              <div className="result-icon">
                {gameResult.result === 'win' ? '🏆' : '🤝'}
              </div>
              <h2 className="result-title">
                {gameResult.result === 'win'
                  ? `Player ${gameResult.winner} Wins!`
                  : "It's a Draw!"}
              </h2>

              {/* ML Prediction Section */}
              {mlLoading && (
                <div className="ml-loading">
                  <span className="ml-spinner" />
                  <span>Analyzing gameplay...</span>
                </div>
              )}

              {mlPrediction && mlPrediction.p1 && (
                <div className="ml-predictions-wrapper">
                  <div className={`ml-prediction-card ${mlPrediction.p2 ? 'dual' : ''}`}>
                    {mlPrediction.p2 && <h3 className="player-profile-title">Player 1</h3>}
                    <div className="ml-tier-badge" style={{ '--tier-color': TIER_COLORS[mlPrediction.p1.skillTier] || '#3b82f6' }}>
                      <span className="tier-label">Skill Tier</span>
                      <span className="tier-value">{mlPrediction.p1.skillTier}</span>
                      <span className="tier-confidence">{Math.round(mlPrediction.p1.confidence * 100)}% conf.</span>
                    </div>
                    <div className="ml-perf-bar">
                      <span className="perf-label">Performance Index</span>
                      <div className="perf-bar-track">
                        <motion.div
                          className="perf-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${mlPrediction.p1.performanceIndex}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="perf-value">{Math.round(mlPrediction.p1.performanceIndex)}/100</span>
                    </div>
                  </div>

                  {mlPrediction.p2 && (
                    <div className="ml-prediction-card dual">
                      <h3 className="player-profile-title">Player 2</h3>
                      <div className="ml-tier-badge" style={{ '--tier-color': TIER_COLORS[mlPrediction.p2.skillTier] || '#3b82f6' }}>
                        <span className="tier-label">Skill Tier</span>
                        <span className="tier-value">{mlPrediction.p2.skillTier}</span>
                        <span className="tier-confidence">{Math.round(mlPrediction.p2.confidence * 100)}% conf.</span>
                      </div>
                      <div className="ml-perf-bar">
                        <span className="perf-label">Performance Index</span>
                        <div className="perf-bar-track">
                          <motion.div
                            className="perf-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${mlPrediction.p2.performanceIndex}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="perf-value">{Math.round(mlPrediction.p2.performanceIndex)}/100</span>
                      </div>
                    </div>
                  )}
                  
                  <p className="ml-source">
                    {mlPrediction.p1.source === 'python_ml' ? '🤖 ML Model' : '📐 Rule-based'}
                  </p>
                </div>
              )}

              {/* Game Stats */}
              <div className="result-stats">
                {gameResult.moveCount != null && (
                  <div className="result-stat">
                    <span className="result-stat-val">{gameResult.moveCount}</span>
                    <span className="result-stat-label">Moves</span>
                  </div>
                )}
                {gameResult.sessionDuration != null && (
                  <div className="result-stat">
                    <span className="result-stat-val">
                      {Math.round(gameResult.sessionDuration / 1000)}s
                    </span>
                    <span className="result-stat-label">Duration</span>
                  </div>
                )}
                {gameResult.scores && (
                  <div className="result-stat">
                    <span className="result-stat-val">
                      {Object.values(gameResult.scores).join(' - ')}
                    </span>
                    <span className="result-stat-label">Score</span>
                  </div>
                )}
              </div>

              <div className="result-actions">
                <button className="btn-glow" onClick={handlePlayAgain}>
                  <span className="btn-glow-text">🔄 Play Again</span>
                </button>
                <button className="btn-outline-hover" onClick={handleQuit}>
                  Quit to Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
