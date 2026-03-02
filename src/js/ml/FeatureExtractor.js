import { dataLogger } from '../data/DataLogger';

export class FeatureExtractor {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // Session data
        this.currentSession = null;
        this.moves = [];
        this.timestamps = [];
        this.sessionStartTime = null;
        this.gameId = null;
    }

    /**
     * Start a new extraction session
     * @param {string} gameId - Game identifier
     */
    startSession(gameId) {
        this.sessionId = crypto.randomUUID();
        this.currentSession = {
            gameId,
            startTime: Date.now(),
            moves: [],
            timestamps: [],
            errors: [],
            patterns: []
        };
        
        this.moves = [];
        this.timestamps = [];
        this.sessionStartTime = Date.now();
        this.gameId = gameId;
        
        console.log(`📊 Feature extraction started for ${gameId} (Session: ${this.sessionId})`);
    }

    /**
     * Record a move
     * @param {Object} moveData - Move data
     */
    recordMove(moveData) {
        if (!this.currentSession) return;
        
        const timestamp = Date.now();
        const decisionTime = this.timestamps.length > 0 
            ? timestamp - this.timestamps[this.timestamps.length - 1]
            : timestamp - this.sessionStartTime;
        
        const enrichedMove = {
            ...moveData,
            timestamp,
            decisionTime,
            moveNumber: this.moves.length + 1
        };
        
        // Log move to Supabase
        dataLogger.logMoveAsync(this.sessionId, {
            move_index: enrichedMove.moveNumber,
            decision_time_ms: enrichedMove.decisionTime,
            move_data: moveData,
            is_optimal: enrichedMove.isOptimal || false,
            is_error: enrichedMove.isError || moveData.valid === false || false
        });

        this.moves.push(enrichedMove);
        this.timestamps.push(timestamp);
        this.currentSession.moves.push(enrichedMove);
        this.currentSession.timestamps.push(timestamp);
        
        // Track errors
        if (moveData.isError || moveData.valid === false) {
            this.currentSession.errors.push({
                moveNumber: this.moves.length,
                type: moveData.errorType || 'invalid_move'
            });
        }
        
        // Detect patterns
        this.detectPatterns(enrichedMove);
    }

    /**
     * Detect patterns in gameplay
     * @param {Object} move - Move data
     */
    detectPatterns(move) {
        if (!this.currentSession) return;
        
        // Simple pattern detection
        // Look for repeated sequences or strategic patterns
        const recentMoves = this.moves.slice(-5);
        
        // Detect winning moves
        if (move.isWinningMove) {
            this.currentSession.patterns.push({
                type: 'winning_move',
                moveNumber: move.moveNumber
            });
        }
        
        // Detect blocking moves
        if (move.isBlockingMove) {
            this.currentSession.patterns.push({
                type: 'blocking_move',
                moveNumber: move.moveNumber
            });
        }
        
        // Detect optimal play
        if (move.isOptimal) {
            this.currentSession.patterns.push({
                type: 'optimal_move',
                moveNumber: move.moveNumber
            });
        }
    }

    /**
     * End the current session and extract features
     * @returns {Object} Extracted features
     */
    endSession() {
        if (!this.currentSession) {
            return null;
        }
        
        const features = this.extractFeatures();
        this.currentSession = null;
        
        return features;
    }

    /**
     * Extract features from the current session
     * @returns {Object} Feature vector
     */
    extractFeatures() {
        if (!this.currentSession || this.moves.length === 0) {
            return this.getDefaultFeatures();
        }
        
        const features = {
            // Temporal features
            avgDecisionTime: this.calculateAvgDecisionTime(),
            decisionTimeVariance: this.calculateDecisionTimeVariance(),
            totalSessionTime: Date.now() - this.sessionStartTime,
            
            // Accuracy features
            moveAccuracy: this.calculateMoveAccuracy(),
            errorRate: this.calculateErrorRate(),
            errorRepetitionRate: this.calculateErrorRepetition(),
            
            // Pattern features
            patternSuccessRate: this.calculatePatternSuccessRate(),
            strategicMoveRate: this.calculateStrategicMoveRate(),
            optimalPlayRate: this.calculateOptimalPlayRate(),
            
            // Consistency features
            consistencyScore: this.calculateConsistencyScore(),
            improvementRate: this.calculateImprovementRate(),
            
            // Game-specific features
            ...this.extractGameSpecificFeatures(),
            
            // Meta features
            gameId: this.gameId,
            sessionId: this.sessionId,
            totalMoves: this.moves.length,
            sessionDuration: Date.now() - this.sessionStartTime
        };
        
        // Emit feature extraction event
        this.eventBus.emit('analytics:featureExtracted', features);
        
        return features;
    }

    /**
     * Calculate average decision time
     * @returns {number} Average decision time in ms
     */
    calculateAvgDecisionTime() {
        if (this.moves.length === 0) return 0;
        
        const decisionTimes = this.moves.map(m => m.decisionTime);
        return decisionTimes.reduce((sum, t) => sum + t, 0) / decisionTimes.length;
    }

    /**
     * Calculate decision time variance
     * @returns {number} Variance in decision time
     */
    calculateDecisionTimeVariance() {
        if (this.moves.length < 2) return 0;
        
        const decisionTimes = this.moves.map(m => m.decisionTime);
        const avg = this.calculateAvgDecisionTime();
        
        const squaredDiffs = decisionTimes.map(t => Math.pow(t - avg, 2));
        return squaredDiffs.reduce((sum, d) => sum + d, 0) / decisionTimes.length;
    }

    /**
     * Calculate move accuracy
     * @returns {number} Move accuracy (0-1)
     */
    calculateMoveAccuracy() {
        if (this.moves.length === 0) return 0;
        
        const validMoves = this.moves.filter(m => m.valid !== false).length;
        return validMoves / this.moves.length;
    }

    /**
     * Calculate error rate
     * @returns {number} Error rate (0-1)
     */
    calculateErrorRate() {
        if (this.moves.length === 0) return 0;
        
        return this.currentSession.errors.length / this.moves.length;
    }

    /**
     * Calculate error repetition rate
     * @returns {number} Error repetition rate (0-1)
     */
    calculateErrorRepetition() {
        const errors = this.currentSession.errors;
        if (errors.length < 2) return 0;
        
        // Check for repeated error types
        const errorTypes = errors.map(e => e.type);
        const uniqueTypes = new Set(errorTypes);
        
        return 1 - (uniqueTypes.size / errors.length);
    }

    /**
     * Calculate pattern success rate
     * @returns {number} Pattern success rate (0-1)
     */
    calculatePatternSuccessRate() {
        const patterns = this.currentSession.patterns;
        if (patterns.length === 0) return 0.5; // Neutral if no patterns detected
        
        const successPatterns = patterns.filter(p => 
            p.type === 'winning_move' || p.type === 'blocking_move' || p.type === 'optimal_move'
        ).length;
        
        return successPatterns / patterns.length;
    }

    /**
     * Calculate strategic move rate
     * @returns {number} Strategic move rate (0-1)
     */
    calculateStrategicMoveRate() {
        if (this.moves.length === 0) return 0;
        
        const strategicMoves = this.moves.filter(m => 
            m.isStrategic || m.isBlockingMove || m.isWinningMove
        ).length;
        
        return strategicMoves / this.moves.length;
    }

    /**
     * Calculate optimal play rate
     * @returns {number} Optimal play rate (0-1)
     */
    calculateOptimalPlayRate() {
        if (this.moves.length === 0) return 0;
        
        const optimalMoves = this.moves.filter(m => m.isOptimal).length;
        return optimalMoves / this.moves.length;
    }

    /**
     * Calculate consistency score
     * @returns {number} Consistency score (0-1)
     */
    calculateConsistencyScore() {
        if (this.moves.length < 3) return 0.5;
        
        // Calculate based on decision time consistency
        const variance = this.calculateDecisionTimeVariance();
        const avgTime = this.calculateAvgDecisionTime();
        
        if (avgTime === 0) return 0.5;
        
        // Coefficient of variation (lower = more consistent)
        const cv = Math.sqrt(variance) / avgTime;
        
        // Convert to 0-1 score (lower cv = higher score)
        return Math.max(0, Math.min(1, 1 - cv));
    }

    /**
     * Calculate improvement rate over the session
     * @returns {number} Improvement rate (-1 to 1)
     */
    calculateImprovementRate() {
        if (this.moves.length < 6) return 0;
        
        const halfPoint = Math.floor(this.moves.length / 2);
        const firstHalf = this.moves.slice(0, halfPoint);
        const secondHalf = this.moves.slice(halfPoint);
        
        // Compare accuracy between halves
        const firstHalfAccuracy = firstHalf.filter(m => m.valid !== false).length / firstHalf.length;
        const secondHalfAccuracy = secondHalf.filter(m => m.valid !== false).length / secondHalf.length;
        
        return secondHalfAccuracy - firstHalfAccuracy;
    }

    /**
     * Extract game-specific features
     * @returns {Object} Game-specific features
     */
    extractGameSpecificFeatures() {
        const features = {};
        
        switch (this.gameId) {
            case 'tictactoe':
            case 'fourinrow':
            case 'reversi':
            case 'checkers':
                features.strategicDepth = this.calculateStrategicDepth();
                features.planningHorizon = this.calculatePlanningHorizon();
                break;
                
            case 'memorymatch':
                features.memoryAccuracy = this.calculateMemoryAccuracy();
                features.recallSpeed = this.calculateRecallSpeed();
                break;
                
            case 'game24':
            case 'minisudoku':
                features.computationSpeed = this.calculateComputationSpeed();
                features.logicalReasoning = this.calculateLogicalReasoning();
                break;
                
            case 'ludo':
                features.riskTaking = this.calculateRiskTaking();
                features.adaptability = this.calculateAdaptability();
                break;
                
            case 'wordchain':
                features.vocabularyDepth = this.calculateVocabularyDepth();
                features.responseSpeed = this.calculateResponseSpeed();
                break;
        }
        
        return features;
    }

    /**
     * Calculate strategic depth for strategy games
     */
    calculateStrategicDepth() {
        // Based on patterns and optimal moves
        return this.calculatePatternSuccessRate() * 0.7 + this.calculateOptimalPlayRate() * 0.3;
    }

    /**
     * Calculate planning horizon
     */
    calculatePlanningHorizon() {
        // Based on decision time and pattern success
        const avgTime = this.calculateAvgDecisionTime();
        const normalized = Math.min(avgTime / 3000, 1); // Normalize to 3 seconds
        return normalized * 0.5 + this.calculateStrategicMoveRate() * 0.5;
    }

    /**
     * Calculate memory accuracy for memory games
     */
    calculateMemoryAccuracy() {
        return this.calculateMoveAccuracy();
    }

    /**
     * Calculate recall speed for memory games
     */
    calculateRecallSpeed() {
        const avgTime = this.calculateAvgDecisionTime();
        return Math.max(0, 1 - (avgTime / 5000)); // Normalize to 5 seconds
    }

    /**
     * Calculate computation speed for math games
     */
    calculateComputationSpeed() {
        const avgTime = this.calculateAvgDecisionTime();
        return Math.max(0, 1 - (avgTime / 10000)); // Normalize to 10 seconds
    }

    /**
     * Calculate logical reasoning
     */
    calculateLogicalReasoning() {
        return this.calculateMoveAccuracy() * 0.6 + this.calculateConsistencyScore() * 0.4;
    }

    /**
     * Calculate risk-taking for chance games
     */
    calculateRiskTaking() {
        // Analyze move choices for risk level
        const riskyMoves = this.moves.filter(m => m.riskLevel === 'high').length;
        return this.moves.length > 0 ? riskyMoves / this.moves.length : 0.5;
    }

    /**
     * Calculate adaptability
     */
    calculateAdaptability() {
        return this.calculateImprovementRate() * 0.5 + 0.5; // Normalize to 0-1
    }

    /**
     * Calculate vocabulary depth for word games
     */
    calculateVocabularyDepth() {
        // Based on word complexity and variety
        return this.calculateMoveAccuracy();
    }

    /**
     * Calculate response speed for word games
     */
    calculateResponseSpeed() {
        return this.calculateRecallSpeed();
    }

    /**
     * Get default features when no data available
     * @returns {Object} Default feature vector
     */
    getDefaultFeatures() {
        return {
            avgDecisionTime: 0,
            decisionTimeVariance: 0,
            totalSessionTime: 0,
            moveAccuracy: 0,
            errorRate: 0,
            errorRepetitionRate: 0,
            patternSuccessRate: 0.5,
            strategicMoveRate: 0,
            optimalPlayRate: 0,
            consistencyScore: 0.5,
            improvementRate: 0,
            gameId: null,
            totalMoves: 0,
            sessionDuration: 0
        };
    }

    /**
     * Get current session stats
     * @returns {Object} Session statistics
     */
    getSessionStats() {
        return {
            moveCount: this.moves.length,
            errorCount: this.currentSession?.errors.length || 0,
            patternCount: this.currentSession?.patterns.length || 0,
            elapsedTime: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
        };
    }
}
