import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { MLClient } from '../js/ml/MLClient';
import { FeatureExtractor } from '../js/ml/FeatureExtractor';
import { dataLogger } from '../js/data/DataLogger';

/**
 * MLProvider — React Context for ML Integration
 * 
 * Provides singleton MLClient and FeatureExtractor instances to all components.
 * Manages session history in localStorage for trend analysis.
 */

const MLContext = createContext(null);

// Storage key for session history
const SESSION_HISTORY_KEY = 'dualmind-session-history';
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
        this._handlers[evt] = this._handlers[evt].filter(h => h !== fn);
      }
    },
    emit(evt, ...args) {
      (this._handlers[evt] || []).forEach(fn => {
        try { fn(...args); } catch (e) { console.error(e); }
      });
    }
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
      setMlStatus(prev => ({
        ...prev,
        ready: true,
        pythonService: client.pythonServiceAvailable,
        sessionHistory: history,
      }));
      console.log(`🤖 MLProvider ready (Python: ${client.pythonServiceAvailable ? '✓' : '✗'})`);
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

  const saveSession = useCallback((sessionData) => {
    try {
      const history = loadSessionHistory();
      history.push({
        ...sessionData,
        timestamp: Date.now(),
      });
      // Keep only the latest N sessions
      const trimmed = history.slice(-MAX_SESSIONS);
      localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(trimmed));
      setMlStatus(prev => ({ ...prev, sessionHistory: trimmed }));
      return trimmed;
    } catch (e) {
      console.error('Failed to save session:', e);
      return [];
    }
  }, [loadSessionHistory]);

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

  const endSessionAndPredict = useCallback(async (gameResult) => {
    const extractor = featureExtractorRef.current;
    const client = mlClientRef.current;

    if (!extractor || !client) return null;

    // Extract features from the game session
    const features = extractor.endSession();
    if (!features) return null;

    try {
      // Get ML predictions (parallel)
      const [skillResult, perfResult] = await Promise.all([
        client.predictSkillTier(features),
        client.estimatePerformance(features),
      ]);

      const prediction = {
        skillTier: skillResult.skillTier || skillResult.skill_tier || 'Unknown',
        confidence: skillResult.confidence || 0.6,
        performanceIndex: perfResult.performanceIndex || perfResult.performance_index || 50,
        explanation: skillResult.explanation || '',
        source: skillResult.source || 'fallback',
        features, // raw features for analytics
      };

      // Log Session to Supabase
      dataLogger.logSessionAsync({
        id: features.sessionId,
        game_id: features.gameId,
        result: gameResult?.result || 'unknown',
        total_moves: features.totalMoves,
        session_duration_ms: features.sessionDuration,
        features: features
      });

      // Log Prediction to Supabase
      dataLogger.logPredictionAsync(features.sessionId, {
        skill_tier: prediction.skillTier,
        confidence: prediction.confidence,
        performance_index: prediction.performanceIndex,
        model_type: prediction.source,
        features_hash: typeof crypto !== 'undefined' ? crypto.randomUUID() : 'unknown'
      });

      // Save to session history
      saveSession({
        gameId: features.gameId,
        result: gameResult?.result || 'unknown',
        skillTier: prediction.skillTier,
        performanceIndex: prediction.performanceIndex,
        features: {
          moveAccuracy: features.moveAccuracy,
          avgDecisionTime: features.avgDecisionTime,
          totalMoves: features.totalMoves,
          sessionDuration: features.sessionDuration,
        },
      });

      setMlStatus(prev => ({
        ...prev,
        lastPrediction: prediction,
      }));

      return prediction;
    } catch (error) {
      console.error('ML prediction failed:', error);
      return null;
    }
  }, [saveSession]);

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

  return (
    <MLContext.Provider value={value}>
      {children}
    </MLContext.Provider>
  );
}

export function useML() {
  const context = useContext(MLContext);
  if (!context) {
    throw new Error('useML must be used within <MLProvider>');
  }
  return context;
}
