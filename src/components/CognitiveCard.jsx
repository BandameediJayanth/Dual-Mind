import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import "./CognitiveCard.css";

export default function CognitiveCard({ prediction, playerName = "Player" }) {
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Provide default fallback values if prediction or features are missing
  const features = prediction?.features || {};

  // Normalize Speed (0-100)
  // Assume 0-5s is the normal range. <0.5s = 100, 5s+ = 0
  const rawTime = features.avgDecisionTime ?? 3000;
  const speedScore = Math.max(
    0,
    Math.min(100, 100 - ((rawTime - 500) / 4500) * 100),
  );

  // Normalize other features (0-100)
  // Use ?? not || so that a real value of 0 is preserved (|| treats 0 as falsy)
  const accuracyScore = (features.moveAccuracy ?? 0.5) * 100;
  const consistencyScore = (features.consistencyScore ?? 0.5) * 100;
  // Prefer optimalPlayRate if available (most accurate signal), fall back to strategicMoveRate
  const strategyRaw =
    features.optimalPlayRate ?? features.strategicMoveRate ?? null;
  const strategyScore = strategyRaw !== null ? strategyRaw * 100 : 50; // 50 = truly unknown
  const performanceScore = prediction?.performanceIndex ?? 50;

  const dataPoints = [
    { label: "Accuracy", value: accuracyScore },
    { label: "Speed", value: speedScore },
    { label: "Consistency", value: consistencyScore },
    { label: "Strategy", value: strategyScore },
    { label: "Performance", value: performanceScore },
  ];

  const generateRadarPolygon = () => {
    const cx = 150;
    const cy = 150;
    const radius = 100;
    const sides = dataPoints.length;

    let points = "";
    dataPoints.forEach((point, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const r = (point.value / 100) * radius;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      points += `${x},${y} `;
    });
    return points.trim();
  };

  const generateBgPolygons = () => {
    const cx = 150;
    const cy = 150;
    const radius = 100;
    const sides = dataPoints.length;

    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    return levels.map((level, lvlIdx) => {
      let points = "";
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const r = radius * level;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        points += `${x},${y} `;
      }
      return <polygon key={lvlIdx} points={points} className="radar-grid" />;
    });
  };

  const getLabelPositions = () => {
    const cx = 150;
    const cy = 150;
    const radius = 125; // slightly outside
    const sides = dataPoints.length;

    return dataPoints.map((point, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      return { x, y, label: point.label, value: Math.round(point.value) };
    });
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#1E1E2E", // Match deep background
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `DualMind-Profile-${playerName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to generate image", error);
    }
    setIsDownloading(false);
  };

  const tierColors = {
    Novice: "#94a3b8",
    Beginner: "#22c55e",
    Intermediate: "#3b82f6",
    Advanced: "#a855f7",
    Expert: "#f59e0b",
  };
  const tierColor = tierColors[prediction?.skillTier] || "#3b82f6";
  const isPythonML = prediction?.source === "python_ml";
  const sourceLabel = isPythonML ? "🤖 ML Model" : "📐 Rule-based";
  const sourceTitle = isPythonML
    ? "Prediction powered by trained Random Forest model"
    : "Prediction powered by rule-based heuristics (Python backend offline)";

  return (
    <div className="cognitive-card-wrapper">
      <div className="cognitive-card" ref={cardRef}>
        <div className="card-header">
          <h2>{playerName}'s Profile</h2>
          <div className="card-header-badges">
            <div
              className="tier-badge"
              style={{
                backgroundColor: `${tierColor}20`,
                color: tierColor,
                border: `1px solid ${tierColor}50`,
              }}
            >
              {prediction?.skillTier || "Unknown"} Tier
            </div>
            {prediction && (
              <div
                className="source-badge"
                title={sourceTitle}
                style={{
                  backgroundColor: isPythonML
                    ? "rgba(168,85,247,0.15)"
                    : "rgba(100,116,139,0.15)",
                  color: isPythonML ? "#a855f7" : "#94a3b8",
                  border: `1px solid ${isPythonML ? "rgba(168,85,247,0.3)" : "rgba(100,116,139,0.3)"}`,
                }}
              >
                {sourceLabel}
              </div>
            )}
          </div>
        </div>

        <div className="radar-container">
          <svg viewBox="0 0 300 300" className="radar-chart">
            {/* Background Grids */}
            {generateBgPolygons()}

            {/* Axes */}
            {dataPoints.map((_, i) => {
              const angle = (Math.PI * 2 * i) / dataPoints.length - Math.PI / 2;
              const x = 150 + Math.cos(angle) * 100;
              const y = 150 + Math.sin(angle) * 100;
              return (
                <line
                  key={i}
                  x1="150"
                  y1="150"
                  x2={x}
                  y2={y}
                  className="radar-axis"
                />
              );
            })}

            {/* Data Polygon */}
            <polygon
              points={generateRadarPolygon()}
              className="radar-data"
              style={{ fill: `${tierColor}50`, stroke: tierColor }}
            />

            {/* Labels */}
            {getLabelPositions().map((pos, i) => (
              <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                <text textAnchor="middle" className="radar-label" dy="-5">
                  {pos.label}
                </text>
                <text textAnchor="middle" className="radar-value" dy="10">
                  {pos.value}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="card-footer">
          <div className="dualmind-logo">🧠 DualMind Cognitive Engine</div>
          <div className="date">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <button
        className="btn-download"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? "Generating..." : "📥 Share Profile"}
      </button>
    </div>
  );
}
