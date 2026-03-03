import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { MLClient } from "../js/ml/MLClient";
import { FeatureExtractor } from "../js/ml/FeatureExtractor";
import { dataLogger } from "../js/data/DataLogger";

/**
 * MLProvider — React Context for ML Integration
 *
 * Provides singleton MLClient and FeatureExtractor instances to all components.
 * Manages session history in localStorage for trend analysis.
 */

const MLContext = createContext(null);

// Storage key for session history
const SESSION_HISTORY_KEY = "dualmind-session-history";
const MAX_SESSIONS = 100;

export function MLProvider({ children }) {
  const mlClientRef = useRef(null);
  const featureExtractorRef = useRef(null);
  const [mlStatus, setMlStatus] = useState({
    ready: false,
    pythonService: false,
    lastPrediction: null,
    sessionHistory: [],
  });

  // Create an event bus for ML events (shared with game engines)
  const eventBusRef = useRef({
    _handlers: {},
    on(evt, fn) {
      if (!this._handlers[evt]) this._handlers[evt] = [];
      this._handlers[evt].push(fn);
    },
    off(evt, fn) {
      if (this._handlers[evt]) {
        this._handlers[evt] = this._handlers[evt].filter((h) => h !== fn);
      }
    },
    emit(evt, ...args) {
      (this._handlers[evt] || []).forEach((fn) => {
        try {
          fn(...args);
        } catch (e) {
          console.error(e);
        }
      });
    },
  });

  useEffect(() => {
    // Initialize ML client and feature extractor once
    const eventBus = eventBusRef.current;
    const client = new MLClient(eventBus);
    const extractor = new FeatureExtractor(eventBus);

    mlClientRef.current = client;
    featureExtractorRef.current = extractor;

    // Load session history
    const history = loadSessionHistory();

    client.init().then(() => {
      setMlStatus((prev) => ({
        ...prev,
        ready: true,
        pythonService: client.pythonServiceAvailable,
        sessionHistory: history,
      }));
      console.log(
        `🤖 MLProvider ready (Python: ${client.pythonServiceAvailable ? "✓" : "✗"})`,
      );
    });
  }, []);

  // --- Session History (localStorage) ---

  const loadSessionHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(SESSION_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const saveSession = useCallback(
    (sessionData) => {
      try {
        const history = loadSessionHistory();
        history.push({
          ...sessionData,
          timestamp: Date.now(),
        });
        // Keep only the latest N sessions
        const trimmed = history.slice(-MAX_SESSIONS);
        localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(trimmed));
        setMlStatus((prev) => ({ ...prev, sessionHistory: trimmed }));
        return trimmed;
      } catch (e) {
        console.error("Failed to save session:", e);
        return [];
      }
    },
    [loadSessionHistory],
  );

  // --- ML Operations ---

  const startSession = useCallback((gameId) => {
    if (featureExtractorRef.current) {
      featureExtractorRef.current.startSession(gameId);
    }
  }, []);

  const recordMove = useCallback((moveData) => {
    if (featureExtractorRef.current) {
      featureExtractorRef.current.recordMove(moveData);
    }
  }, []);

  const endSessionAndPredict = useCallback(
    async (gameResult) => {
      const extractor = featureExtractorRef.current;
      const client = mlClientRef.current;

      if (!extractor || !client) return null;

      // Respect the Cognitive Monitoring toggle (Settings page)
      if (localStorage.getItem("dualmind_cognitive_monitoring") === "false")
        return null;

      // Extract features from the game session for both players
      const extractedFeatures = extractor.endSession(gameResult);
      if (!extractedFeatures || !extractedFeatures.p1) return null;

      try {
        // Get ML predictions (parallel) for p1
        const p1Promise = Promise.all([
          client.predictSkillTier(extractedFeatures.p1),
          client.estimatePerformance(extractedFeatures.p1),
        ]);

        // Get ML predictions for p2 if it exists
        const p2Promise = extractedFeatures.p2
          ? Promise.all([
              client.predictSkillTier(extractedFeatures.p2),
              client.estimatePerformance(extractedFeatures.p2),
            ])
          : Promise.resolve([null, null]);

        const [[p1Skill, p1Perf], [p2Skill, p2Perf]] = await Promise.all([
          p1Promise,
          p2Promise,
        ]);

        const formatPrediction = (skillResult, perfResult, features) => ({
          skillTier:
            skillResult.skillTier || skillResult.skill_tier || "Unknown",
          confidence: skillResult.confidence || 0.6,
          performanceIndex:
            perfResult.performanceIndex || perfResult.performance_index || 50,
          explanation: skillResult.explanation || "",
          source: skillResult.source || "fallback",
          features, // raw features for analytics
        });

        const prediction = {
          p1: formatPrediction(p1Skill, p1Perf, extractedFeatures.p1),
        };

        if (extractedFeatures.p2) {
          prediction.p2 = formatPrediction(
            p2Skill,
            p2Perf,
            extractedFeatures.p2,
          );
        }

        // Log Session to Supabase
        dataLogger.logSessionAsync({
          id: extractedFeatures.p1.sessionId,
          game_id: extractedFeatures.p1.gameId,
          result: gameResult?.result || "unknown",
          total_moves:
            extractedFeatures.p1.totalMoves +
            (extractedFeatures.p2 ? extractedFeatures.p2.totalMoves : 0),
          session_duration_ms: extractedFeatures.p1.sessionDuration,
          features: extractedFeatures,
        });

        // Log Prediction to Supabase (P1)
        dataLogger.logPredictionAsync(extractedFeatures.p1.sessionId, {
          skill_tier: prediction.p1.skillTier,
          confidence: prediction.p1.confidence,
          performance_index: prediction.p1.performanceIndex,
          model_type: prediction.p1.source,
          features_hash:
            typeof crypto !== "undefined" ? crypto.randomUUID() : "unknown",
        });
        // Skip P2 logging to simple predictions table for now to avoid duplicate session ID clashes
        // unless we had a multi-row log map, but this is fine for fallback metrics.

        // Save to session history (using p1 as the primary logged profile)
        saveSession({
          gameId: extractedFeatures.p1.gameId,
          result: gameResult?.result || "unknown",
          skillTier: prediction.p1.skillTier,
          performanceIndex: prediction.p1.performanceIndex,
          features: {
            moveAccuracy: extractedFeatures.p1.moveAccuracy,
            avgDecisionTime: extractedFeatures.p1.avgDecisionTime,
            totalMoves: extractedFeatures.p1.totalMoves,
            sessionDuration: extractedFeatures.p1.sessionDuration,
          },
        });

        setMlStatus((prev) => ({
          ...prev,
          lastPrediction: prediction.p1, // keeps backward compat for top-level status
        }));

        return prediction;
      } catch (error) {
        console.error("ML prediction failed:", error);
        return null;
      }
    },
    [saveSession],
  );

  const analyzeTrends = useCallback(async () => {
    const client = mlClientRef.current;
    if (!client) return null;

    const history = loadSessionHistory();
    if (history.length < 2) return null;

    try {
      return await client.analyzeTrends(history);
    } catch {
      return null;
    }
  }, [loadSessionHistory]);

  const value = {
    mlStatus,
    startSession,
    recordMove,
    endSessionAndPredict,
    analyzeTrends,
    getSessionHistory: loadSessionHistory,
  };

  return <MLContext.Provider value={value}>{children}</MLContext.Provider>;
}

export function useML() {
  const context = useContext(MLContext);
  if (!context) {
    throw new Error("useML must be used within <MLProvider>");
  }
  return context;
}
