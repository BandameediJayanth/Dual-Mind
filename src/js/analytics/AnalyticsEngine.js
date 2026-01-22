/**
 * AnalyticsEngine - Performance Analytics and Tracking
 * Processes gameplay data and generates insights
 */

export class AnalyticsEngine {
    constructor(eventBus, storage) {
        this.eventBus = eventBus;
        this.storage = storage;
        
        // Analytics state
        this.sessions = [];
        this.iqTrends = [];
        this.currentPerformanceIndex = null;
        this.currentSkillTier = 'Novice';
        
        // Skill tier thresholds
        this.tierThresholds = {
            novice: { min: 0, max: 20 },
            beginner: { min: 20, max: 40 },
            intermediate: { min: 40, max: 60 },
            advanced: { min: 60, max: 80 },
            expert: { min: 80, max: 100 }
        };
    }

    /**
     * Initialize the analytics engine
     */
    async init() {
        // Load stored data
        await this.loadStoredData();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('📊 Analytics Engine initialized');
    }

    /**
     * Load stored analytics data
     */
    async loadStoredData() {
        try {
            const sessions = await this.storage.get('sessions');
            if (sessions) {
                this.sessions = sessions;
            }
            
            const trends = await this.storage.get('iqTrends');
            if (trends) {
                this.iqTrends = trends;
            }
            
            // Calculate current performance from history
            if (this.iqTrends.length > 0) {
                const recent = this.iqTrends.slice(-10);
                const avgScore = recent.reduce((sum, t) => sum + t.score, 0) / recent.length;
                this.currentPerformanceIndex = Math.round(avgScore);
                this.currentSkillTier = this.calculateTier(this.currentPerformanceIndex);
            }
        } catch (error) {
            console.warn('Failed to load analytics data:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.eventBus.on('analytics:featureExtracted', (features) => {
            this.processFeatures(features);
        });
        
        this.eventBus.on('analytics:predictionReady', (prediction) => {
            this.processPrediction(prediction);
        });
    }

    /**
     * Load sessions from storage
     * @param {Array} sessions - Session data
     */
    loadSessions(sessions) {
        this.sessions = sessions || [];
    }

    /**
     * Load IQ trends from storage
     * @param {Array} trends - Trend data
     */
    loadTrends(trends) {
        this.iqTrends = trends || [];
    }

    /**
     * Record a game session
     * @param {Object} sessionData - Session data
     */
    async recordSession(sessionData) {
        const session = {
            ...sessionData,
            id: Date.now(),
            timestamp: Date.now()
        };
        
        this.sessions.push(session);
        
        // Process prediction if available
        if (sessionData.prediction) {
            await this.processPrediction(sessionData.prediction);
        }
        
        // Save to storage
        await this.storage.set('sessions', this.sessions);
        
        // Emit update event
        this.eventBus.emit('analytics:update', {
            session,
            performanceIndex: this.currentPerformanceIndex,
            skillTier: this.currentSkillTier
        });
    }

    /**
     * Process extracted features
     * @param {Object} features - Feature data
     */
    processFeatures(features) {
        // Calculate basic performance metrics
        const metrics = this.calculateMetrics(features);
        
        // Store metrics for trend analysis
        this.updateTrends(metrics);
    }

    /**
     * Process ML prediction
     * @param {Object} prediction - ML prediction
     */
    async processPrediction(prediction) {
        const score = prediction.performanceIndex || prediction.score || 50;
        
        // Add to trends
        this.iqTrends.push({
            score,
            skillTier: prediction.skillTier,
            confidence: prediction.confidence,
            timestamp: Date.now()
        });
        
        // Keep only last 100 trends
        if (this.iqTrends.length > 100) {
            this.iqTrends = this.iqTrends.slice(-100);
        }
        
        // Update current performance
        const recentTrends = this.iqTrends.slice(-10);
        this.currentPerformanceIndex = Math.round(
            recentTrends.reduce((sum, t) => sum + t.score, 0) / recentTrends.length
        );
        this.currentSkillTier = this.calculateTier(this.currentPerformanceIndex);
        
        // Save to storage
        await this.storage.set('iqTrends', this.iqTrends);
    }

    /**
     * Calculate performance metrics from features
     * @param {Object} features - Feature data
     * @returns {Object} Calculated metrics
     */
    calculateMetrics(features) {
        const metrics = {
            decisionSpeed: this.normalizeScore(features.avgDecisionTime, 500, 5000, true),
            accuracy: this.normalizeScore(features.moveAccuracy, 0, 1),
            consistency: this.normalizeScore(features.consistencyScore, 0, 1),
            patternRecognition: this.normalizeScore(features.patternSuccessRate, 0, 1),
            errorRate: this.normalizeScore(features.errorRate, 0, 0.5, true)
        };
        
        // Calculate overall score (weighted average)
        const weights = {
            decisionSpeed: 0.15,
            accuracy: 0.30,
            consistency: 0.20,
            patternRecognition: 0.25,
            errorRate: 0.10
        };
        
        metrics.overall = Object.entries(weights).reduce((sum, [key, weight]) => {
            return sum + (metrics[key] || 50) * weight;
        }, 0);
        
        return metrics;
    }

    /**
     * Normalize a value to a 0-100 score
     * @param {number} value - Raw value
     * @param {number} min - Minimum expected value
     * @param {number} max - Maximum expected value
     * @param {boolean} inverse - Whether lower is better
     * @returns {number} Normalized score (0-100)
     */
    normalizeScore(value, min, max, inverse = false) {
        if (value === undefined || value === null) return 50;
        
        let normalized = ((value - min) / (max - min)) * 100;
        normalized = Math.max(0, Math.min(100, normalized));
        
        if (inverse) {
            normalized = 100 - normalized;
        }
        
        return Math.round(normalized);
    }

    /**
     * Update trend data
     * @param {Object} metrics - Performance metrics
     */
    updateTrends(metrics) {
        const trendPoint = {
            score: metrics.overall,
            metrics,
            timestamp: Date.now()
        };
        
        this.iqTrends.push(trendPoint);
        
        // Keep only last 100 trends
        if (this.iqTrends.length > 100) {
            this.iqTrends = this.iqTrends.slice(-100);
        }
    }

    /**
     * Calculate skill tier from performance index
     * @param {number} score - Performance index
     * @returns {string} Skill tier name
     */
    calculateTier(score) {
        if (score >= this.tierThresholds.expert.min) return 'Expert';
        if (score >= this.tierThresholds.advanced.min) return 'Advanced';
        if (score >= this.tierThresholds.intermediate.min) return 'Intermediate';
        if (score >= this.tierThresholds.beginner.min) return 'Beginner';
        return 'Novice';
    }

    /**
     * Get performance summary
     * @returns {Object} Performance summary
     */
    getSummary() {
        return {
            performanceIndex: this.currentPerformanceIndex,
            skillTier: this.currentSkillTier,
            totalSessions: this.sessions.length,
            recentTrend: this.getRecentTrend()
        };
    }

    /**
     * Get recent performance trend
     * @returns {string} Trend direction ('up', 'down', 'stable')
     */
    getRecentTrend() {
        if (this.iqTrends.length < 5) return 'stable';
        
        const recent = this.iqTrends.slice(-5);
        const older = this.iqTrends.slice(-10, -5);
        
        if (older.length === 0) return 'stable';
        
        const recentAvg = recent.reduce((sum, t) => sum + t.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, t) => sum + t.score, 0) / older.length;
        
        const diff = recentAvg - olderAvg;
        
        if (diff > 5) return 'up';
        if (diff < -5) return 'down';
        return 'stable';
    }

    /**
     * Get feature importance data
     * @returns {Array} Feature importance array
     */
    getFeatureImportance() {
        return [
            { name: 'Move Accuracy', importance: 30 },
            { name: 'Pattern Recognition', importance: 25 },
            { name: 'Consistency', importance: 20 },
            { name: 'Decision Speed', importance: 15 },
            { name: 'Error Avoidance', importance: 10 }
        ];
    }

    /**
     * Get trend data for chart
     * @param {number} count - Number of points
     * @returns {Array} Trend data points
     */
    getTrendData(count = 20) {
        return this.iqTrends.slice(-count).map(t => ({
            score: t.score,
            timestamp: t.timestamp
        }));
    }

    /**
     * Get session history
     * @param {number} count - Number of sessions
     * @returns {Array} Session history
     */
    getSessionHistory(count = 10) {
        return this.sessions.slice(-count);
    }

    /**
     * Get game-specific analytics
     * @param {string} gameId - Game identifier
     * @returns {Object} Game-specific analytics
     */
    getGameAnalytics(gameId) {
        const gameSessions = this.sessions.filter(s => s.gameId === gameId);
        
        if (gameSessions.length === 0) {
            return {
                gamesPlayed: 0,
                winRate: 0,
                avgMoves: 0,
                avgDuration: 0
            };
        }
        
        const wins = gameSessions.filter(s => s.winner === 'player1').length;
        const totalMoves = gameSessions.reduce((sum, s) => sum + (s.moveCount || 0), 0);
        const totalDuration = gameSessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0);
        
        return {
            gamesPlayed: gameSessions.length,
            winRate: Math.round((wins / gameSessions.length) * 100),
            avgMoves: Math.round(totalMoves / gameSessions.length),
            avgDuration: Math.round(totalDuration / gameSessions.length / 1000)
        };
    }

    /**
     * Refresh analytics display
     */
    refreshDisplay() {
        this.eventBus.emit('analytics:update', {
            performanceIndex: this.currentPerformanceIndex,
            skillTier: this.currentSkillTier,
            trends: this.getTrendData(),
            featureImportance: this.getFeatureImportance(),
            sessions: this.getSessionHistory()
        });
    }

    /**
     * Reset analytics data
     */
    reset() {
        this.sessions = [];
        this.iqTrends = [];
        this.currentPerformanceIndex = null;
        this.currentSkillTier = 'Novice';
    }

    /**
     * Update analytics with new data
     * @param {Object} data - Update data
     */
    update(data) {
        if (data.performanceIndex !== undefined) {
            this.currentPerformanceIndex = data.performanceIndex;
        }
        if (data.skillTier) {
            this.currentSkillTier = data.skillTier;
        }
    }
}
