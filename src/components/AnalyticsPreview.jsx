import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import './AnalyticsPreview.css';

function AnimatedCounter({ value, suffix = '', duration = 2 }) {
  const ref = useRef(null);
  const hasAnimated = useRef(false);
  const numValue = parseFloat(value) || 0;

  useEffect(() => {
    if (hasAnimated.current || !ref.current) return;
    hasAnimated.current = true;
    const el = ref.current;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: numValue,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.val) + suffix;
      },
    });
  }, [numValue, suffix, duration]);

  return <span ref={ref}>0{suffix}</span>;
}

const stats = [
  { label: 'Games Available', value: '10', suffix: '', icon: '🎮' },
  { label: 'Cognitive Domains', value: '6', suffix: '', icon: '🧠' },
  { label: 'ML Accuracy', value: '95', suffix: '%', icon: '🎯' },
  { label: 'Real-time Tracking', value: '100', suffix: '%', icon: '⚡' },
];

const features = [
  {
    title: 'Cognitive Fingerprinting',
    desc: 'Map your mental strengths across 6 cognitive domains through gameplay patterns.',
    icon: '🧭',
  },
  {
    title: 'Practice Effect Correction',
    desc: 'Our ML model separates genuine cognitive improvement from game familiarity.',
    icon: '📈',
  },
  {
    title: 'Real-time Performance Index',
    desc: 'Track your cognitive performance with our non-clinical scoring system.',
    icon: '⚙️',
  },
];

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AnalyticsPreview() {
  return (
    <section className="analytics-section" id="analytics">
      <div className="container">
        <div className="analytics-header">
          <h2 className="analytics-title">
            Intelligence, <span className="gradient-text">Measured</span>
          </h2>
          <p className="analytics-subtitle">
            Every move you make feeds our cognitive analysis engine
          </p>
        </div>

        {/* Stats Row */}
        <motion.div
          className="stats-row"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} className="stat-card-item glass-card" variants={fadeUp}>
              <span className="stat-icon">{stat.icon}</span>
              <div className="stat-number">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <span className="stat-label-text">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          className="features-grid"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              className="feature-card glass-card"
              variants={fadeUp}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-text">
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
