import React, { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';
import './NeuralPaths.css';

/**
 * Two clean neural pathways with glowing traveller dots.
 * Minimal but premium — simulates data flowing through a neural network.
 */
export default function NeuralPaths() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const paths = container.querySelectorAll('.neural-path');
    const travellers = container.querySelectorAll('.path-traveller');

    // Travellers follow paths
    travellers.forEach((traveller, i) => {
      const pathEl = paths[i];
      if (!pathEl) return;

      const motionPath = anime.path(pathEl);

      anime({
        targets: traveller,
        translateX: motionPath('x'),
        translateY: motionPath('y'),
        easing: 'linear',
        duration: 7000 + i * 3000,
        loop: true,
      });
    });

    // Subtle line drawing
    paths.forEach((path, i) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;

      anime({
        targets: path,
        strokeDashoffset: [length, 0],
        easing: 'easeInOutSine',
        duration: 6000,
        delay: i * 800,
        loop: true,
        direction: 'alternate',
        endDelay: 2000,
      });
    });
  }, []);

  return (
    <div className="neural-paths-container" ref={containerRef}>
      <svg
        className="neural-svg"
        viewBox="0 0 1400 700"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Path 1: Wide arc from left toward center-right */}
        <path
          className="neural-path"
          d="M-20 400 C250 320, 550 180, 900 300 C1050 350, 1150 380, 1300 340"
          stroke="url(#npGrad1)"
          strokeWidth="1"
        />

        {/* Path 2: Lower sweep from right */}
        <path
          className="neural-path"
          d="M1420 520 C1150 490, 900 560, 650 420 C500 350, 350 300, 100 340"
          stroke="url(#npGrad2)"
          strokeWidth="0.8"
        />

        <defs>
          <linearGradient id="npGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
            <stop offset="30%" stopColor="#7c3aed" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="npGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="80%" stopColor="#7c3aed" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Two traveller dots — one per path */}
      <div className="path-traveller trav-purple" />
      <div className="path-traveller trav-cyan" />
    </div>
  );
}
