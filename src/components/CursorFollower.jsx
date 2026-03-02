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

      // Smooth lag effect on the main cursor
      anime({
        targets: cursor,
        left: mouseX,
        top: mouseY,
        duration: 200,
        easing: 'easeOutSine',
      });
    };

    // Scale up on interactive elements
    const onEnterInteractive = () => {
      anime({
        targets: cursor,
        scale: 2.5,
        opacity: 0.8,
        duration: 300,
        easing: 'easeOutQuad',
      });
    };

    const onLeaveInteractive = () => {
      anime({
        targets: cursor,
        scale: 1,
        opacity: 1,
        duration: 300,
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
    <div ref={cursorRef} className="cursor-main" />
  );
}
