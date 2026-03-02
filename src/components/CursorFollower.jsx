import React, { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';
import './CursorFollower.css';

export default function CursorFollower() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Dot follows instantly
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';

      // Ring follows with anime.js spring lag
      anime({
        targets: ring,
        left: mouseX,
        top: mouseY,
        duration: 600,
        easing: 'easeOutExpo',
      });
    };

    // Scale up on interactive elements
    const onEnterInteractive = () => {
      anime({
        targets: ring,
        scale: 2.5,
        opacity: 0.15,
        borderColor: 'rgba(124, 58, 237, 0.6)',
        duration: 300,
        easing: 'easeOutQuad',
      });
      anime({
        targets: dot,
        scale: 0.5,
        duration: 200,
        easing: 'easeOutQuad',
      });
    };

    const onLeaveInteractive = () => {
      anime({
        targets: ring,
        scale: 1,
        opacity: 0.3,
        borderColor: 'rgba(124, 58, 237, 0.4)',
        duration: 300,
        easing: 'easeOutQuad',
      });
      anime({
        targets: dot,
        scale: 1,
        duration: 200,
        easing: 'easeOutQuad',
      });
    };

    window.addEventListener('mousemove', onMove);

    // Observe interactive elements
    const attachHover = () => {
      document.querySelectorAll('button, a, .game-card-item, .glass-card, .nav-link, .nav-cta, .btn-primary, .btn-ghost, .toggle').forEach(el => {
        el.addEventListener('mouseenter', onEnterInteractive);
        el.addEventListener('mouseleave', onLeaveInteractive);
      });
    };

    // Reattach on DOM changes
    attachHover();
    const observer = new MutationObserver(attachHover);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
