import React, { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';
import './AnimatedText.css';

export default function AnimatedText({ text, className = '', delay = 0 }) {
  const containerRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    const chars = containerRef.current.querySelectorAll('.anim-char');
    const isGradient = className.includes('gradient');

    const tl = anime.timeline({ easing: 'easeOutExpo' });

    // Phase 1: Letters slide in
    tl.add({
      targets: chars,
      translateY: [40, 0],
      opacity: [0, 1],
      rotateX: [90, 0],
      duration: 800,
      delay: anime.stagger(30, { start: delay }),
    });

    // Phase 2: Color wave (only for non-gradient text)
    if (!isGradient) {
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-bright').trim() || '#0f172a';
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim() || '#0ea5e9';
      tl.add({
        targets: chars,
        color: [textColor, accentColor, textColor],
        duration: 600,
        delay: anime.stagger(25),
      }, '-=400');
    }
  }, [text, delay, className]);

  return (
    <span ref={containerRef} className={`animated-text ${className}`}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="anim-char"
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}
