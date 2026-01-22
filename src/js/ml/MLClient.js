/**
 * MLClient - JavaScript Client for Python ML Service
 * 
 * ARCHITECTURE:
 * - All ML training and inference is handled by Python (Random Forest / XGBoost)
 * - This JavaScript module:
 *   1. Extracts and prepares feature vectors from gameplay
 *   2. Sends requests to Python ML API
 *   3. Receives and processes predictions
 *   4. Uses rule-based fallback ONLY when Python service is unavailable
 * 
 * FORBIDDEN:
 * - TensorFlow.js, Brain.js, or any JS-based ML training/inference
 */

export class MLClient {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isReady = false;
        this.pythonServiceAvailable = false;
        
        // Python ML API endpoint (configurable)
        this.apiEndpoint = 'http://localhost:5000/api/ml';
        
        // Request timeout
        this.requestTimeout = 5000;
        
        // Skill tiers (must match Python model output)
        this.skillTiers = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
        
        // Cache for predictions (reduce API calls)
        this.predictionCache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache
    }

    /**
     * Initialize the ML client
     */
    async init() {
        try {
            await this.checkPythonService();
            this.isReady = true;
            
            if (this.eventBus) {
                this.eventBus.emit('ml:ready', { 
                    pythonService: this.pythonServiceAvailable 
                });
            }
            
            console.log(`🤖 ML Client initialized (Python service: ${this.pythonServiceAvailable ? 'connected' : 'unavailable'})`);
        } catch (error) {
            console.warn('ML Client: Python service not available, using fallback');
            this.pythonServiceAvailable = false;
            this.isReady = true;
        }
    }

    /**
     * Check if Python ML service is available
     */
    async checkPythonService() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${this.apiEndpoint}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                this.pythonServiceAvailable = data.status === 'ok';
                this.modelStatus = data.models || {};
                return true;
            }
        } catch (error) {
            this.pythonServiceAvailable = false;
            throw error;
        }
        
        return false;
    }

    /**
     * Set custom API endpoint
     */
    setApiEndpoint(endpoint) {
        this.apiEndpoint = endpoint;
        this.pythonServiceAvailable = false; // Reset until checked
    }

    /**
     * Predict skill tier from gameplay features
     * @param {Object} features - Gameplay feature vector
     * @returns {Object} Prediction result
     */
    async predictSkillTier(features) {
        if (!features) {
            throw new Error('Features are required');
        }

        // Check cache
        const cacheKey = this.getCacheKey('skill', features);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        let result;

        if (this.pythonServiceAvailable) {
            try {
                result = await this.callPythonAPI('/predict/skill', { features });
                result.source = 'python_ml';
            } catch (error) {
                console.warn('Python API failed, using fallback:', error.message);
                result = this.fallbackSkillPrediction(features);
                result.source = 'fallback';
            }
        } else {
            result = this.fallbackSkillPrediction(features);
            result.source = 'fallback';
        }

        // Cache result
        this.setCache(cacheKey, result);

        return result;
    }

    /**
     * Estimate performance index from gameplay features
     * @param {Object} features - Gameplay feature vector
     * @returns {Object} Performance estimation result
     */
    async estimatePerformance(features) {
        if (!features) {
            throw new Error('Features are required');
        }

        // Check cache
        const cacheKey = this.getCacheKey('performance', features);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        let result;

        if (this.pythonServiceAvailable) {
            try {
                result = await this.callPythonAPI('/predict/performance', { features });
                result.source = 'python_ml';
            } catch (error) {
                console.warn('Python API failed, using fallback:', error.message);
                result = this.fallbackPerformanceEstimation(features);
                result.source = 'fallback';
            }
        } else {
            result = this.fallbackPerformanceEstimation(features);
            result.source = 'fallback';
        }

        // Cache result
        this.setCache(cacheKey, result);

        return result;
    }

    /**
     * Analyze performance trends from session history
     * @param {Array} sessions - Array of session data
     * @returns {Object} Trend analysis result
     */
    async analyzeTrends(sessions) {
        if (!sessions || !Array.isArray(sessions)) {
            throw new Error('Sessions array is required');
        }

        if (this.pythonServiceAvailable) {
            try {
                const result = await this.callPythonAPI('/analyze/trends', { sessions });
                result.source = 'python_ml';
                return result;
            } catch (error) {
                console.warn('Python API failed, using fallback:', error.message);
            }
        }

        // Fallback trend analysis
        return this.fallbackTrendAnalysis(sessions);
    }

    /**
     * Batch prediction for multiple feature sets
     * @param {Array} featuresList - Array of feature objects
     * @param {string} predictionType - 'skill' or 'performance'
     * @returns {Array} Array of predictions
     */
    async predictBatch(featuresList, predictionType = 'skill') {
        if (!featuresList || !Array.isArray(featuresList)) {
            throw new Error('Features list array is required');
        }

        if (this.pythonServiceAvailable) {
            try {
                const result = await this.callPythonAPI('/predict/batch', {
                    features_list: featuresList,
                    prediction_type: predictionType
                });
                return result.predictions;
            } catch (error) {
                console.warn('Batch prediction failed, using individual fallbacks');
            }
        }

        // Fallback to individual predictions
        const predictions = [];
        for (const features of featuresList) {
            if (predictionType === 'skill') {
                predictions.push(this.fallbackSkillPrediction(features));
            } else {
                predictions.push(this.fallbackPerformanceEstimation(features));
            }
        }
        return predictions;
    }

    /**
     * Call Python ML API
     * @private
     */
    async callPythonAPI(endpoint, data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(`${this.apiEndpoint}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `API error: ${response.status}`);
            }

            const result = await response.json();
            return result.prediction || result.analysis || result;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // ==========================================
    // RULE-BASED FALLBACKS
    // Used ONLY when Python service is unavailable
    // ==========================================

    /**
     * Fallback skill prediction (rule-based)
     * @private
     */
    fallbackSkillPrediction(features) {
        const weights = {
            moveAccuracy: 0.25,
            patternSuccessRate: 0.20,
            consistencyScore: 0.15,
            optimalPlayRate: 0.20,
            decisionSpeed: 0.10,
            errorPenalty: 0.10
        };

        // Normalize feature names (convert from snake_case if needed)
        const f = this.normalizeFeatureNames(features);

        // Decision speed score
        const avgTime = f.avgDecisionTime || 3000;
        let decisionSpeed;
        if (avgTime < 500) decisionSpeed = 0.5;      // Too fast
        else if (avgTime < 1500) decisionSpeed = 1.0;
        else if (avgTime < 3000) decisionSpeed = 0.8;
        else if (avgTime < 5000) decisionSpeed = 0.6;
        else decisionSpeed = 0.4;

        const errorPenalty = 1 - (f.errorRate || 0.2);

        // Calculate weighted score
        let score = 0;
        score += (f.moveAccuracy || 0.5) * weights.moveAccuracy * 100;
        score += (f.patternSuccessRate || 0.5) * weights.patternSuccessRate * 100;
        score += (f.consistencyScore || 0.5) * weights.consistencyScore * 100;
        score += (f.optimalPlayRate || 0.3) * weights.optimalPlayRate * 100;
        score += decisionSpeed * weights.decisionSpeed * 100;
        score += errorPenalty * weights.errorPenalty * 100;

        // Determine tier
        let tierIdx;
        if (score >= 85) tierIdx = 4;
        else if (score >= 70) tierIdx = 3;
        else if (score >= 50) tierIdx = 2;
        else if (score >= 30) tierIdx = 1;
        else tierIdx = 0;

        return {
            skillTier: this.skillTiers[tierIdx],
            skillTierIndex: tierIdx,
            confidence: 0.6,
            probabilities: Object.fromEntries(
                this.skillTiers.map((t, i) => [t, i === tierIdx ? 0.6 : 0.1])
            ),
            explanation: `Fallback prediction based on ${Math.round(score)} weighted score`,
            warning: 'Using rule-based fallback - Python ML service unavailable'
        };
    }

    /**
     * Fallback performance estimation (rule-based)
     * @private
     */
    fallbackPerformanceEstimation(features) {
        const f = this.normalizeFeatureNames(features);

        // Start at middle
        let score = 50;

        // Accuracy contribution (±25 points)
        const accuracy = f.moveAccuracy || 0.5;
        score += (accuracy - 0.5) * 50;

        // Speed contribution (±10 points)
        const avgTime = f.avgDecisionTime || 3000;
        if (avgTime < 2000) score += 10;
        else if (avgTime < 4000) score += 5;
        else if (avgTime > 6000) score -= 5;

        // Consistency contribution (±10 points)
        const consistency = f.consistencyScore || 0.5;
        score += (consistency - 0.5) * 20;

        // Pattern recognition bonus
        const patternRate = f.patternSuccessRate || 0.5;
        score += (patternRate - 0.5) * 10;

        // Clamp score
        score = Math.max(0, Math.min(100, score));

        // Determine tier
        let tier;
        if (score >= 90) tier = 'Expert';
        else if (score >= 75) tier = 'Advanced';
        else if (score >= 55) tier = 'Intermediate';
        else if (score >= 35) tier = 'Beginner';
        else tier = 'Novice';

        return {
            performanceIndex: Math.round(score * 10) / 10,
            skillTier: tier,
            uncertainty: 10.0,
            confidenceInterval: {
                low: Math.max(0, score - 15),
                high: Math.min(100, score + 15)
            },
            componentScores: {
                accuracy: Math.round(accuracy * 100),
                speed: avgTime < 3000 ? 70 : 50,
                consistency: Math.round(consistency * 100)
            },
            explanation: `Fallback estimation: ${Math.round(score)} (${tier})`,
            warning: 'Using rule-based fallback - Python ML service unavailable'
        };
    }

    /**
     * Fallback trend analysis
     * @private
     */
    fallbackTrendAnalysis(sessions) {
        if (!sessions.length) {
            return {
                overallTrend: 0,
                trendDirection: 'insufficient_data',
                sessionsAnalyzed: 0,
                warning: 'No sessions to analyze'
            };
        }

        const scores = sessions.map(s => 
            s.performanceIndex || s.performance_index || s.score || 50
        );

        // Simple linear trend
        const n = scores.length;
        if (n < 2) {
            return {
                overallTrend: 0,
                trendDirection: 'stable',
                sessionsAnalyzed: n,
                statistics: { mean: scores[0], latest: scores[0] }
            };
        }

        const xMean = (n - 1) / 2;
        const yMean = scores.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < n; i++) {
            numerator += (i - xMean) * (scores[i] - yMean);
            denominator += (i - xMean) ** 2;
        }

        const slope = denominator !== 0 ? numerator / denominator : 0;
        const normalizedTrend = Math.tanh(slope / 10);

        let trendDirection;
        if (normalizedTrend > 0.3) trendDirection = 'strong_improvement';
        else if (normalizedTrend > 0.1) trendDirection = 'improvement';
        else if (normalizedTrend > -0.1) trendDirection = 'stable';
        else if (normalizedTrend > -0.3) trendDirection = 'decline';
        else trendDirection = 'strong_decline';

        return {
            overallTrend: normalizedTrend,
            trendDirection,
            statistics: {
                mean: yMean,
                min: Math.min(...scores),
                max: Math.max(...scores),
                latest: scores[n - 1]
            },
            sessionsAnalyzed: n,
            source: 'fallback',
            warning: 'Using rule-based fallback - Python ML service unavailable'
        };
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Normalize feature names (handle both camelCase and snake_case)
     * @private
     */
    normalizeFeatureNames(features) {
        const normalized = {};
        
        for (const [key, value] of Object.entries(features)) {
            // Convert snake_case to camelCase
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            normalized[camelKey] = value;
        }
        
        return normalized;
    }

    /**
     * Generate cache key from features
     * @private
     */
    getCacheKey(type, features) {
        const featureStr = JSON.stringify(features);
        return `${type}:${this.hashString(featureStr)}`;
    }

    /**
     * Simple string hash
     * @private
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    /**
     * Get from cache if not expired
     * @private
     */
    getFromCache(key) {
        const cached = this.predictionCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    /**
     * Set cache entry
     * @private
     */
    setCache(key, data) {
        this.predictionCache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Clean old entries
        if (this.predictionCache.size > 100) {
            const oldest = [...this.predictionCache.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp)
                .slice(0, 20);
            oldest.forEach(([k]) => this.predictionCache.delete(k));
        }
    }

    /**
     * Clear prediction cache
     */
    clearCache() {
        this.predictionCache.clear();
    }
}
