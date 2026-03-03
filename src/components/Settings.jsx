import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./Settings.css";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("dualmind-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [animations, setAnimations] = useState(
    () => localStorage.getItem("dualmind_animations") !== "false",
  );

  const [cognitiveMonitoring, setCognitiveMonitoring] = useState(
    () => localStorage.getItem("dualmind_cognitive_monitoring") !== "false",
  );

  const [storeData, setStoreData] = useState(
    () => localStorage.getItem("dualmind_data_consent") !== "false",
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("dualmind-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("dualmind-theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (!animations) {
      document.documentElement.setAttribute("data-reduced-motion", "true");
    } else {
      document.documentElement.removeAttribute("data-reduced-motion");
    }
    localStorage.setItem("dualmind_animations", animations ? "true" : "false");
  }, [animations]);

  useEffect(() => {
    localStorage.setItem(
      "dualmind_cognitive_monitoring",
      cognitiveMonitoring ? "true" : "false",
    );
  }, [cognitiveMonitoring]);

  useEffect(() => {
    localStorage.setItem("dualmind_data_consent", storeData ? "true" : "false");
  }, [storeData]);

  const exportJSON = () => {
    const history = localStorage.getItem("dualmind-session-history");
    if (!history) {
      alert("No session data to export.");
      return;
    }
    const blob = new Blob([history], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dualmind-sessions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const history = localStorage.getItem("dualmind-session-history");
    if (!history) {
      alert("No session data to export.");
      return;
    }
    let sessions;
    try {
      sessions = JSON.parse(history);
    } catch {
      alert("Could not parse session data.");
      return;
    }
    if (!sessions || !sessions.length) {
      alert("No session data to export.");
      return;
    }
    // Flatten top-level keys only (skip nested objects)
    const keys = [
      "id",
      "game_id",
      "result",
      "total_moves",
      "session_duration_ms",
      "skillTier",
      "performanceIndex",
      "confidence",
      "source",
    ];
    const csv = [
      keys.join(","),
      ...sessions.map((s) =>
        keys.map((k) => JSON.stringify(s[k] ?? "")).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dualmind-sessions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (
      !window.confirm(
        "Clear all session history and player data? This cannot be undone.",
      )
    )
      return;
    [
      "dualmind-session-history",
      "dualmind_player_id",
      "dualmind_data_consent",
    ].forEach((k) => localStorage.removeItem(k));
    setStoreData(true); // reset UI to default after clearing
    alert("All data cleared.");
  };

  return (
    <section className="settings-view">
      <div className="container">
        <h2 className="view-title">
          <span className="gradient-text">Settings</span>
        </h2>

        <div className="settings-grid">
          <motion.div
            className="settings-group glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="group-title">⚙️ Display</h3>
            <label className="setting-row">
              <span>Dark Mode</span>
              <input
                type="checkbox"
                className="toggle"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            </label>
            <label className="setting-row">
              <span>Animations</span>
              <input
                type="checkbox"
                className="toggle"
                checked={animations}
                onChange={(e) => setAnimations(e.target.checked)}
              />
            </label>
            <label className="setting-row">
              <span>Sound Effects</span>
              <input
                type="checkbox"
                className="toggle"
                defaultChecked
                disabled
                title="Coming soon"
              />
            </label>
          </motion.div>

          <motion.div
            className="settings-group glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="group-title">🔒 Analytics & Privacy</h3>
            <label className="setting-row">
              <span>Cognitive Monitoring</span>
              <input
                type="checkbox"
                className="toggle"
                checked={cognitiveMonitoring}
                onChange={(e) => setCognitiveMonitoring(e.target.checked)}
              />
            </label>
            <label className="setting-row">
              <span>Store Session Data</span>
              <input
                type="checkbox"
                className="toggle"
                checked={storeData}
                onChange={(e) => setStoreData(e.target.checked)}
              />
            </label>
          </motion.div>

          <motion.div
            className="settings-group glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="group-title">📦 Data Management</h3>
            <div className="settings-actions">
              <button className="btn-outline" onClick={exportJSON}>
                📤 Export JSON
              </button>
              <button className="btn-outline" onClick={exportCSV}>
                📊 Export CSV
              </button>
              <button className="btn-danger" onClick={clearAllData}>
                🗑️ Clear All Data
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
