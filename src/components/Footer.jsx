import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">🧠</span>
          <div>
            <div className="footer-name">Dual Mind</div>
            <div className="footer-tagline">ML-Driven Cognitive Game Suite</div>
          </div>
        </div>
        <div className="footer-links">
          <a href="#hero">Home</a>
          <a href="#games">Games</a>
          <a href="#analytics">Analytics</a>
        </div>
        <div className="footer-copy">
          © 2026 Dual Mind. Built for research purposes.
        </div>
      </div>
    </footer>
  );
}
