import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './Settings.css';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('dualmind-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('dualmind-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('dualmind-theme', 'light');
    }
  }, [darkMode]);

  return (
    <section className="settings-view">
      <div className="container">
        <h2 className="view-title">
          <span className="gradient-text">Settings</span>
        </h2>

        <div className="settings-grid">
          <motion.div
            className="settings-group glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="group-title">⚙️ Display</h3>
            <label className="setting-row">
              <span>Dark Mode</span>
              <input
                type="checkbox"
                className="toggle"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            </label>
            <label className="setting-row">
              <span>Animations</span>
              <input type="checkbox" className="toggle" defaultChecked />
            </label>
            <label className="setting-row">
              <span>Sound Effects</span>
              <input type="checkbox" className="toggle" defaultChecked />
            </label>
          </motion.div>

          <motion.div
            className="settings-group glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="group-title">🔒 Analytics & Privacy</h3>
            <label className="setting-row">
              <span>Cognitive Monitoring</span>
              <input type="checkbox" className="toggle" defaultChecked />
            </label>
            <label className="setting-row">
              <span>Store Session Data</span>
              <input type="checkbox" className="toggle" defaultChecked />
            </label>
          </motion.div>

          <motion.div
            className="settings-group glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="group-title">📦 Data Management</h3>
            <div className="settings-actions">
              <button className="btn-outline">📤 Export JSON</button>
              <button className="btn-outline">📊 Export CSV</button>
              <button className="btn-danger">🗑️ Clear All Data</button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
