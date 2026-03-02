import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import './Hero.css';

gsap.registerPlugin(ScrollTrigger);

const floatingIcons = ['♟️', '🎲', '🧩', '🃏', '🎯', '🏆'];

export default function Hero() {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax fade-out on scroll
      gsap.to('.hero-content', {
        y: -100,
        opacity: 0,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      // Floating icons parallax (each at different speed)
      gsap.utils.toArray('.floating-icon').forEach((icon, i) => {
        gsap.to(icon, {
          y: -150 - (i * 30),
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="hero section" id="hero">
      {/* Background gradient orbs */}
      <div className="hero-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Floating game icons */}
      <div className="floating-icons">
        {floatingIcons.map((icon, i) => (
          <motion.div
            key={i}
            className="floating-icon"
            initial={{ opacity: 0, y: 50 }}
            animate={{
              opacity: 0.3,
              y: 0,
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              delay: 0.5 + i * 0.15,
              duration: 4,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              fontSize: `${2.5 + (i % 3) * 1.2}rem`,
            }}
          >
            {icon}
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="hero-content container">
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span className="badge-dot" />
          ML-Driven Cognitive Analytics
        </motion.div>

        <motion.h1
          ref={titleRef}
          className="hero-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Play. Compete.{' '}
          <span className="gradient-text">Evolve.</span>
        </motion.h1>

        <motion.p
          ref={subtitleRef}
          className="hero-subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
        >
          10 classic games. Real-time cognitive performance tracking.
          <br />
          Discover your mental strengths through play.
        </motion.p>

        <motion.div
          ref={ctaRef}
          className="hero-cta"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <a href="#games" className="btn-primary">
            Start Playing
            <span className="btn-arrow">→</span>
          </a>
          <a href="#analytics" className="btn-ghost">
            View Analytics
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <div className="scroll-line" />
          <span>Scroll to explore</span>
        </motion.div>
      </div>
    </section>
  );
}
