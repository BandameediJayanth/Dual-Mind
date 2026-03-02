import React, { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';
import './Particles.css';

const PARTICLE_COUNT = 30;

export default function Particles() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      const size = Math.random() * 3 + 1;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.opacity = Math.random() * 0.3 + 0.05;

      container.appendChild(particle);

      // Animate each particle with anime.js
      anime({
        targets: particle,
        translateY: [0, -(Math.random() * 100 + 50)],
        translateX: [0, (Math.random() - 0.5) * 80],
        opacity: [{ value: Math.random() * 0.3 + 0.1, duration: 1000 }, { value: 0, duration: 1000 }],
        scale: [1, Math.random() * 0.5 + 0.5],
        duration: Math.random() * 6000 + 4000,
        delay: Math.random() * 3000,
        loop: true,
        easing: 'easeInOutSine',
      });
    }

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} className="particles-container" />;
}
