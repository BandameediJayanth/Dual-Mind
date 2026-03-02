import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './components/Home';
import GameShowcase from './components/GameShowcase';
import GameView from './components/GameView';
import AnalyticsPreview from './components/AnalyticsPreview';
import Settings from './components/Settings';
import Footer from './components/Footer';
import CursorFollower from './components/CursorFollower';
import PageLoader from './components/PageLoader';
import Particles from './components/Particles';
import DataConsentBanner from './components/DataConsentBanner';
import { MLProvider } from './components/MLProvider';
import './styles/global.css';

const pageVariants = {
  initial: { opacity: 0, y: 30, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
};

const pageTransition = {
  duration: 0.4,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedGame, setSelectedGame] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Apply stored theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('dualmind-theme');
    if (stored === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Navigate handler: always clears selected game
  const handleNavigate = (view) => {
    setSelectedGame(null);
    setCurrentView(view);
  };

  return (
    <MLProvider>
    <div className="app">
      {!loaded && <PageLoader onComplete={() => setLoaded(true)} />}
      <CursorFollower />
      <Particles />
      <Navbar currentView={currentView} onNavigate={handleNavigate} />
      <main className="main-content">
        <DataConsentBanner />
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <Home onNavigate={handleNavigate} />
            </motion.div>
          )}
          {currentView === 'games' && (
            <motion.div
              key="games"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              {selectedGame ? (
                <GameView
                  gameId={selectedGame}
                  onBack={() => {
                    setSelectedGame(null);
                    setCurrentView('games');
                    window.scrollTo(0, 0);
                  }}
                />
              ) : (
                <GameShowcase onGameSelect={setSelectedGame} />
              )}
            </motion.div>
          )}
          {currentView === 'analytics' && (
            <motion.div
              key="analytics"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <AnalyticsPreview />
            </motion.div>
          )}
          {currentView === 'settings' && (
            <motion.div
              key="settings"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <Settings />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
    </MLProvider>
  );
}
