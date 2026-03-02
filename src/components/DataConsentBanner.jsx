import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DataConsentBanner.css';

export default function DataConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('dualmind_data_consent');
    if (!hasConsented) {
      // Small delay so it doesn't instantly snap in on first load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('dualmind_data_consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="consent-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          <div className="consent-content">
            <span className="consent-icon">🔬</span>
            <p>
              <strong>Data Collection Notice:</strong> We collect anonymous gameplay data (moves, times, results) to improve our Machine Learning models. No personal identifiers are logged.
            </p>
          </div>
          <button className="btn-consent" onClick={handleAccept}>
            Got it
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
