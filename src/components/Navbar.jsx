import React from 'react';
import { motion } from 'framer-motion';
import './Navbar.css';
import logoImg from '../assets/images/logo.png';
import titleImg from '../assets/images/title.png';

const navLinks = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'leaderboards', label: 'Leaderboards', icon: '🏆' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Navbar({ currentView, onNavigate }) {
  return (
    <motion.nav
      className="navbar navbar--scrolled"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.5 }}
    >
      <div className="navbar-inner container">
        <button
          className="nav-logo"
          onClick={() => onNavigate('home')}
        >
          <img src={logoImg} alt="DualMind Logo" className="logo-img" />
          <img src={titleImg} alt="DUALMIND" className="title-img" />
        </button>

        <div className="nav-links">
          {navLinks.map(link => (
            <button
              key={link.id}
              className={`nav-link ${currentView === link.id ? 'nav-link--active' : ''}`}
              onClick={() => onNavigate(link.id)}
            >
              <span className="nav-link-icon">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </div>

        <button
          className="nav-cta"
          onClick={() => onNavigate('games')}
        >
          Play Now
        </button>
      </div>
    </motion.nav>
  );
}
