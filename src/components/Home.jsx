import React from 'react';
import { motion } from 'framer-motion';
import AnimatedText from './AnimatedText';
import NeuralPaths from './NeuralPaths';
import './Home.css';
import logoImg from '../assets/images/logo.png';

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const fadeRight = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.7 } },
};

const fadeLeft = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.8, delay: 0.3 } },
};

const domains = [
  { icon: '🧠', title: 'Memory', desc: 'Pattern recall & working memory' },
  { icon: '♟️', title: 'Strategy', desc: 'Planning & tactical thinking' },
  { icon: '⚡', title: 'Speed', desc: 'Reaction time & quick decisions' },
  { icon: '🎯', title: 'Focus', desc: 'Sustained attention & accuracy' },
  { icon: '🔤', title: 'Language', desc: 'Verbal fluency & word skills' },
  { icon: '🧩', title: 'Logic', desc: 'Problem-solving & reasoning' },
];

export default function Home({ onNavigate }) {
  return (
    <div className="home-page">
      {/* ============ HERO SECTION ============ */}
      <section className="hero-section">
        {/* Split gradient background */}
        <div className="hero-split-bg" />

        {/* Neural pathway motion paths */}
        <NeuralPaths />

        <div className="hero-container container">
          {/* LEFT: Text content */}
          <motion.div
            className="hero-left"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.div className="ml-badge" variants={fadeRight}>
              <span className="badge-pulse" />
              <span>ML-Driven Cognitive Analytics</span>
            </motion.div>

            <motion.div className="hero-headline" variants={fadeRight}>
              <h1 className="headline-stack">
                <span className="headline-line"><AnimatedText text="Play." delay={300} /></span>
                <span className="headline-line"><AnimatedText text="Compete." delay={500} /></span>
                <span className="headline-line headline-accent"><AnimatedText text="Evolve." delay={700} /></span>
              </h1>
            </motion.div>

            <motion.p className="hero-desc" variants={fadeRight}>
              10 classic games with real-time cognitive performance tracking.
              Discover your mental strengths through play.
            </motion.p>

            <motion.div className="hero-buttons" variants={fadeRight}>
              <button className="btn-glow" onClick={() => onNavigate('games')}>
                <span className="btn-glow-text">Start Playing</span>
                <span className="btn-glow-arrow">→</span>
              </button>
              <button className="btn-outline-hover" onClick={() => onNavigate('analytics')}>
                View Analytics
              </button>
            </motion.div>
          </motion.div>

          {/* RIGHT: Brain graphic */}
          <motion.div
            className="hero-right"
            variants={fadeLeft}
            initial="initial"
            animate="animate"
          >
            <div className="brain-graphic">
              <div className="brain-glow" />
              <img src={logoImg} alt="DualMind" className="brain-logo" />
              {/* Orbiting rings */}
              <div className="orbit-ring orbit-1" />
              <div className="orbit-ring orbit-2" />
              <div className="orbit-ring orbit-3" />
              {/* Data points */}
              <div className="data-point dp-1">♟️</div>
              <div className="data-point dp-2">🧠</div>
              <div className="data-point dp-3">🎯</div>
              <div className="data-point dp-4">⚡</div>
            </div>
          </motion.div>
        </div>

        {/* Floating stats cards */}
        <motion.div
          className="floating-stats container"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
        >
          <div className="stat-float glass-float">
            <span className="stat-float-val">10</span>
            <span className="stat-float-label">Games</span>
          </div>
          <div className="stat-float glass-float">
            <span className="stat-float-val">6</span>
            <span className="stat-float-label">Cognitive Domains</span>
          </div>
          <div className="stat-float glass-float">
            <span className="stat-float-val">95%</span>
            <span className="stat-float-label">ML Accuracy</span>
          </div>
          <div className="stat-float glass-float">
            <span className="stat-float-val">Real-time</span>
            <span className="stat-float-label">Performance Index</span>
          </div>
        </motion.div>
      </section>

      {/* ============ KEY FEATURES SECTION ============ */}
      <section className="features-section">
        <div className="container">
          <motion.h2
            className="section-heading"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            6 Cognitive <span className="gradient-text">Domains</span>
          </motion.h2>
          <motion.p
            className="section-subheading"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Every game maps to one or more cognitive abilities
          </motion.p>

          <div className="domains-grid">
            {domains.map((d, i) => (
              <motion.div
                key={d.title}
                className="domain-card glass-float"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <span className="domain-icon">{d.icon}</span>
                <h3 className="domain-title">{d.title}</h3>
                <p className="domain-desc">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BOTTOM CTA ============ */}
      <section className="bottom-cta-section">
        <div className="container bottom-cta-content">
          <motion.h2
            className="section-heading"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Ready to discover your <span className="gradient-text">cognitive profile</span>?
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <button className="btn-glow btn-glow-lg" onClick={() => onNavigate('games')}>
              <span className="btn-glow-text">Start Playing Now</span>
              <span className="btn-glow-arrow">→</span>
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
