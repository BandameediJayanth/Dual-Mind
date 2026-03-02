import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs/lib/anime.es.js';
import './CursorFollower.css';

export default function CursorFollower() {
  const cursorRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if it's a touch device or small screen
    const checkMobile = () => {
      const match = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      setIsMobile(match || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    
    const cursor = cursorRef.current;
    if (!cursor) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Smooth follow for the arrow cursor
      anime({
        targets: cursor,
        left: mouseX,
        top: mouseY,
        duration: 100, // Very snappy
        easing: 'linear',
      });
    };

    // Glow and slight scale on interactive elements
    const onEnterInteractive = () => {
      cursor.classList.add('cursor-hovering');
      anime({
        targets: cursor,
        scale: 1.1,
        duration: 200,
        easing: 'easeOutQuad',
      });
    };

    const onLeaveInteractive = () => {
      cursor.classList.remove('cursor-hovering');
      anime({
        targets: cursor,
        scale: 1,
        duration: 200,
        easing: 'easeOutQuad',
      });
    };

    window.addEventListener('mousemove', onMove);

    // Observe interactive elements
    const attachHover = () => {
      document.querySelectorAll('button, a, .game-card-item, .glass-card, .nav-link, .nav-cta, .btn-primary, .btn-ghost, .toggle, .fiar-cell, .ttt-cell').forEach(el => {
        el.addEventListener('mouseenter', onEnterInteractive);
        el.addEventListener('mouseleave', onLeaveInteractive);
      });
    };

    // Reattach on DOM changes
    attachHover();
    const observer = new MutationObserver((mutations) => {
      // Small debounce
      setTimeout(attachHover, 50);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      observer.disconnect();
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <div ref={cursorRef} className="cursor-main">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cursorGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path d="M7.70711 7.29289C6.81658 6.40237 7.2023 4.8876 8.44181 4.41378L26.3768 2.01633C27.5796 1.85532 28.5284 2.8728 28.2974 4.06734L25.12 18.0645C24.8471 19.3332 23.2383 19.5843 22.5186 18.4714L18.4984 12.2575C17.9715 11.4429 16.985 11.2335 16.143 11.7588L9.12469 16.1384C8.01604 16.83 6.54132 15.8277 6.84279 14.5422L7.70711 7.29289Z" 
              fill="url(#cursorGrad)" 
              stroke="rgba(255,255,255,0.8)" 
              strokeWidth="1.5" 
              strokeLinejoin="round" 
              filter="url(#glow)"/>
      </svg>
    </div>
  );
}
