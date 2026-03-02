import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './GameShowcase.css';

const games = [
  { id: 'tictactoe', name: 'Tic Tac Toe', icon: '❌', category: 'Strategy', color: '#e94560' },
  { id: 'fourinarow', name: 'Four in a Row', icon: '🔴', category: 'Strategy', color: '#533483' },
  { id: 'checkers', name: 'Checkers', icon: '♟️', category: 'Board', color: '#0f3460' },
  { id: 'dotsandboxes', name: 'Dots & Boxes', icon: '🔲', category: 'Strategy', color: '#06b6d4' },
  { id: 'memorymatch', name: 'Memory Match', icon: '🧠', category: 'Memory', color: '#8b5cf6' },
  { id: 'wordchain', name: 'Word Chain', icon: '🔤', category: 'Language', color: '#10b981' },
  { id: 'ludo', name: 'Ludo', icon: '🎲', category: 'Board', color: '#f59e0b' },
  { id: 'snakeandladders', name: 'Snake & Ladders', icon: '🐍', category: 'Board', color: '#ef4444' },
  { id: 'colorwars', name: 'Color Wars', icon: '🎨', category: 'Strategy', color: '#ec4899' },
  { id: 'seawars', name: 'Sea Wars', icon: '🚢', category: 'Strategy', color: '#3b82f6' },
];

const containerAnim = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

const cardAnim = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function GameShowcase({ onGameSelect }) {
  return (
    <section className="showcase" id="games">
      <div className="container">
        <div className="showcase-header">
          <h2 className="showcase-title">
            Choose Your <span className="gradient-text">Challenge</span>
          </h2>
          <p className="showcase-subtitle">
            10 games designed to test different cognitive abilities
          </p>
        </div>

        <motion.div
          className="games-grid"
          variants={containerAnim}
          initial="initial"
          animate="animate"
        >
          {games.map((game) => (
            <motion.div
              key={game.name}
              className="game-card-item glass-card"
              variants={cardAnim}
              whileHover={{
                y: -8,
                transition: { duration: 0.3, ease: 'easeOut' },
              }}
              style={{ '--card-accent': game.color, cursor: 'pointer' }}
              onClick={() => onGameSelect && onGameSelect(game.id)}
            >
              <div className="card-icon-wrap">
                <span className="card-icon">{game.icon}</span>
              </div>
              <div className="card-info">
                <span className="card-category">{game.category}</span>
                <h3 className="card-name">{game.name}</h3>
              </div>
              <div className="card-glow" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
