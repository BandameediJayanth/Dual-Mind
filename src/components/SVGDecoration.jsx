import React, { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';
import './SVGDecoration.css';

export default function SVGDecoration() {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Draw circuit lines with staggered reveal
    anime({
      targets: '.circuit-line',
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 2500,
      delay: anime.stagger(200, { start: 500 }),
      easing: 'easeInOutCubic',
      loop: true,
      direction: 'alternate',
      endDelay: 2000,
    });

    // Pulse the nodes
    anime({
      targets: '.circuit-node',
      scale: [0, 1],
      opacity: [0, 0.7],
      delay: anime.stagger(150, { start: 1200 }),
      duration: 600,
      easing: 'easeOutBack',
      loop: true,
      direction: 'alternate',
      endDelay: 3000,
    });

    // Rotating hex
    anime({
      targets: '.hex-shape',
      rotate: '1turn',
      duration: 20000,
      easing: 'linear',
      loop: true,
    });

    anime({
      targets: '.hex-shape-inner',
      rotate: '-1turn',
      duration: 15000,
      easing: 'linear',
      loop: true,
    });
  }, []);

  return (
    <div className="svg-decoration" ref={svgRef}>
      {/* Left side circuit */}
      <svg className="circuit-svg circuit-left" viewBox="0 0 200 600" fill="none">
        <path className="circuit-line" d="M180 0 L180 120 L100 120 L100 250 L50 250 L50 380 L150 380 L150 500 L80 500 L80 600" stroke="url(#purpleGrad)" strokeWidth="1" />
        <path className="circuit-line" d="M120 0 L120 80 L40 80 L40 200 L160 200 L160 340 L90 340 L90 450 L170 450 L170 600" stroke="url(#cyanGrad)" strokeWidth="0.8" />
        <circle className="circuit-node" cx="180" cy="120" r="3" fill="#7c3aed" />
        <circle className="circuit-node" cx="100" cy="250" r="3" fill="#38bdf8" />
        <circle className="circuit-node" cx="50" cy="380" r="3" fill="#7c3aed" />
        <circle className="circuit-node" cx="80" cy="500" r="3" fill="#38bdf8" />
        <circle className="circuit-node" cx="40" cy="200" r="2" fill="#7c3aed" />
        <circle className="circuit-node" cx="160" cy="340" r="2" fill="#38bdf8" />
        <defs>
          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Right side circuit */}
      <svg className="circuit-svg circuit-right" viewBox="0 0 200 600" fill="none">
        <path className="circuit-line" d="M20 0 L20 150 L100 150 L100 280 L150 280 L150 420 L60 420 L60 550 L130 550 L130 600" stroke="url(#purpleGrad2)" strokeWidth="1" />
        <path className="circuit-line" d="M80 0 L80 100 L160 100 L160 230 L40 230 L40 370 L120 370 L120 480 L30 480 L30 600" stroke="url(#cyanGrad2)" strokeWidth="0.8" />
        <circle className="circuit-node" cx="100" cy="150" r="3" fill="#7c3aed" />
        <circle className="circuit-node" cx="150" cy="280" r="3" fill="#38bdf8" />
        <circle className="circuit-node" cx="60" cy="420" r="3" fill="#7c3aed" />
        <circle className="circuit-node" cx="130" cy="550" r="3" fill="#38bdf8" />
        <defs>
          <linearGradient id="purpleGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="cyanGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Spinning hexagons - top right */}
      <svg className="hex-svg" viewBox="0 0 120 120" fill="none">
        <polygon className="hex-shape" points="60,5 110,30 110,90 60,115 10,90 10,30" stroke="#7c3aed" strokeWidth="0.5" opacity="0.15" />
        <polygon className="hex-shape-inner" points="60,20 95,38 95,82 60,100 25,82 25,38" stroke="#38bdf8" strokeWidth="0.5" opacity="0.1" />
      </svg>
    </div>
  );
}
