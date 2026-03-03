import React, { useEffect, useState } from "react";
import anime from "animejs/lib/anime.es.js";
import logoImg from "../assets/images/logo.png";
import "./PageLoader.css";

export default function PageLoader({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Progress bar animation
    anime({
      targets: ".loader-bar",
      width: ["0%", "100%"],
      duration: 1800,
      easing: "easeInOutQuart",
    });

    // Logo pulse
    anime({
      targets: ".loader-logo",
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 600,
      easing: "easeOutBack",
    });

    // Text shimmer
    anime({
      targets: ".loader-text span",
      opacity: [0, 1],
      translateY: [10, 0],
      delay: anime.stagger(50),
      duration: 400,
      easing: "easeOutQuad",
    });

    // Fade out after load
    const timer = setTimeout(() => {
      anime({
        targets: ".page-loader",
        opacity: [1, 0],
        duration: 500,
        easing: "easeInQuad",
        complete: () => {
          setVisible(false);
          if (onComplete) onComplete();
        },
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="page-loader">
      <div className="loader-content">
        <img src={logoImg} alt="" className="loader-logo" />
        <div className="loader-text">
          {"DUALMIND".split("").map((char, i) => (
            <span key={i}>{char}</span>
          ))}
        </div>
        <div className="loader-track">
          <div className="loader-bar" />
        </div>
        <div className="loader-subtitle">Loading cognitive engine...</div>
      </div>
    </div>
  );
}
