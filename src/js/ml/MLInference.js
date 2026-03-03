/**
 * MLInference - Machine Learning Inference Engine
 * Runs predictions using trained models
 */

export class MLInference {
  constructor() {
    // Model configuration
    this.model = null;
    this.modelType = "randomForest"; // 'randomForest' or 'xgboost'
    this.isModelLoaded = false;

    // Feature normalization parameters
    this.featureScalers = {
      avgDecisionTime: { min: 500, max: 10000 },
      decisionTimeVariance: { min: 0, max: 5000000 },
      moveAccuracy: { min: 0, max: 1 },
      errorRate: { min: 0, max: 1 },
      patternSuccessRate: { min: 0, max: 1 },
      consistencyScore: { min: 0, max: 1 },
      optimalPlayRate: { min: 0, max: 1 },
      strategicMoveRate: { min: 0, max: 1 },
    };

    // Skill tier labels
    this.skillTiers = [
      "Novice",
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert",
    ];
  }

  /**
   * Initialize the inference engine
   */
  async init() {
    try {
      // Try to load pre-trained model
      await this.loadModel();
      console.log("🤖 ML Inference Engine initialized");
    } catch (error) {
      console.warn("Using fallback rule-based inference:", error);
      this.isModelLoaded = false;
    }
  }

  /**
   * Load a pre-trained model
   */
  async loadModel() {
    // In a real implementation, this would load a trained model
    // For now, we'll use a rule-based system as fallback

    // Simulated model loading
    this.model = this.createRuleBasedModel();
    this.isModelLoaded = true;
  }

  /**
   * Create a rule-based model as fallback
   * @returns {Object} Rule-based model
   */
  createRuleBasedModel() {
    return {
      predict: (features) => {
        // Weights reflect features that now have real variance:
        // optimalPlayRate and strategicMoveRate are real since games emit isOptimal/isStrategic.
        // moveAccuracy is ~1.0 for everyone (all game moves valid), so minimal weight.
        const weights = {
          optimalPlayRate: 0.3, // strongest real signal
          strategicMoveRate: 0.2, // real since game fixes
          consistencyScore: 0.2, // always real (decision time)
          decisionSpeed: 0.15, // always real
          moveAccuracy: 0.1, // mostly 1.0, limited signal
          errorPenalty: 0.05, // mostly 0.9+, low signal
        };

        // Decision speed score: penalise too-fast (likely random) & too-slow
        const avgTime = features.avgDecisionTime || 2000;
        const decisionSpeed =
          avgTime < 500
            ? 0.5
            : avgTime < 1000
              ? 1.0
              : avgTime < 2000
                ? 0.9
                : avgTime < 4000
                  ? 0.7
                  : avgTime < 6000
                    ? 0.5
                    : 0.3;

        const errorPenalty = 1 - (features.errorRate || 0);

        let score = 0;
        score +=
          (features.optimalPlayRate || 0) * weights.optimalPlayRate * 100;
        score +=
          (features.strategicMoveRate || 0) * weights.strategicMoveRate * 100;
        score +=
          (features.consistencyScore || 0.5) * weights.consistencyScore * 100;
        score += decisionSpeed * weights.decisionSpeed * 100;
        score += (features.moveAccuracy || 0.5) * weights.moveAccuracy * 100;
        score += errorPenalty * weights.errorPenalty * 100;

        // Small bonuses for game-specific cognitive features
        if (features.strategicDepth) score += features.strategicDepth * 4;
        if (features.memoryAccuracy) score += features.memoryAccuracy * 3;
        if (features.logicalReasoning) score += features.logicalReasoning * 3;

        score = Math.max(0, Math.min(100, score));
        return { score };
      },
    };
  }

  /**
   * Run prediction on feature vector
   * @param {Object} features - Feature vector
   * @returns {Object} Prediction result
   */
  async predict(features) {
    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features);

    // Get prediction
    let prediction;

    if (this.isModelLoaded && this.model) {
      prediction = this.model.predict(normalizedFeatures);
    } else {
      prediction = this.fallbackPredict(normalizedFeatures);
    }

    // Calculate skill tier
    const skillTier = this.calculateSkillTier(prediction.score);

    // Calculate confidence
    const confidence = this.calculateConfidence(features);

    const result = {
      performanceIndex: Math.round(prediction.score),
      skillTier,
      confidence,
      tierProbabilities: this.calculateTierProbabilities(prediction.score),
      featureContributions: this.calculateFeatureContributions(features),
      explanation: this.generateExplanation(
        features,
        prediction.score,
        skillTier,
      ),
    };

    return result;
  }

  /**
   * Normalize features to 0-1 range
   * @param {Object} features - Raw features
   * @returns {Object} Normalized features
   */
  normalizeFeatures(features) {
    const normalized = { ...features };

    Object.entries(this.featureScalers).forEach(([key, scaler]) => {
      if (features[key] !== undefined) {
        normalized[key] =
          (features[key] - scaler.min) / (scaler.max - scaler.min);
        normalized[key] = Math.max(0, Math.min(1, normalized[key]));
      }
    });

    return normalized;
  }

  /**
   * Fallback prediction using simple heuristics
   * @param {Object} features - Normalized features
   * @returns {Object} Prediction result
   */
  fallbackPredict(features) {
    // Simple weighted average of key features
    const weights = {
      moveAccuracy: 0.3,
      patternSuccessRate: 0.25,
      consistencyScore: 0.2,
      optimalPlayRate: 0.15,
      improvementRate: 0.1,
    };

    let score = 50; // Base score

    Object.entries(weights).forEach(([key, weight]) => {
      if (features[key] !== undefined) {
        score += (features[key] - 0.5) * weight * 100;
      }
    });

    // Penalty for high error rate
    if (features.errorRate) {
      score -= features.errorRate * 20;
    }

    score = Math.max(0, Math.min(100, score));

    return { score };
  }

  /**
   * Calculate skill tier from score
   * @param {number} score - Performance score
   * @returns {string} Skill tier
   */
  calculateSkillTier(score) {
    if (score >= 80) return "Expert";
    if (score >= 60) return "Advanced";
    if (score >= 40) return "Intermediate";
    if (score >= 20) return "Beginner";
    return "Novice";
  }

  /**
   * Calculate prediction confidence
   * @param {Object} features - Feature vector
   * @returns {number} Confidence percentage
   */
  calculateConfidence(features) {
    // Base confidence
    let confidence = 70;

    // Increase confidence with more moves
    const moveCount = features.totalMoves || 0;
    if (moveCount >= 20) confidence += 15;
    else if (moveCount >= 10) confidence += 10;
    else if (moveCount >= 5) confidence += 5;

    // Increase confidence with consistent play
    const consistency = features.consistencyScore || 0.5;
    confidence += (consistency - 0.5) * 20;

    // Cap confidence
    confidence = Math.max(50, Math.min(95, confidence));

    return Math.round(confidence);
  }

  /**
   * Calculate probabilities for each tier
   * @param {number} score - Performance score
   * @returns {Object} Tier probabilities
   */
  calculateTierProbabilities(score) {
    // Generate probability distribution around the score
    const probs = {};
    const tiers = this.skillTiers;
    const tierCenters = [10, 30, 50, 70, 90];

    let total = 0;
    tiers.forEach((tier, i) => {
      const distance = Math.abs(score - tierCenters[i]);
      const prob = Math.exp(-distance / 20);
      probs[tier.toLowerCase()] = prob;
      total += prob;
    });

    // Normalize
    Object.keys(probs).forEach((tier) => {
      probs[tier] = Math.round((probs[tier] / total) * 100);
    });

    return probs;
  }

  /**
   * Calculate feature contributions to score
   * @param {Object} features - Feature vector
   * @returns {Object} Feature contributions
   */
  calculateFeatureContributions(features) {
    const contributions = [];

    const featureNames = {
      optimalPlayRate: "Optimal Play",
      strategicMoveRate: "Strategic Moves",
      consistencyScore: "Consistency",
      moveAccuracy: "Move Accuracy",
      errorRate: "Error Avoidance",
    };

    Object.entries(featureNames).forEach(([key, name]) => {
      if (features[key] !== undefined) {
        let value = features[key];
        if (key === "errorRate") {
          value = 1 - value; // Invert for display
        }
        contributions.push({
          name,
          value: Math.round(value * 100),
          impact:
            value >= 0.6 ? "positive" : value >= 0.4 ? "neutral" : "negative",
        });
      }
    });

    return contributions;
  }

  /**
   * Generate human-readable explanation
   * @param {Object} features - Feature vector
   * @param {number} score - Performance score
   * @param {string} tier - Skill tier
   * @returns {string} Explanation text
   */
  generateExplanation(features, score, tier) {
    const explanations = [];

    // Accuracy feedback
    if (features.moveAccuracy >= 0.9) {
      explanations.push("Excellent move accuracy");
    } else if (features.moveAccuracy >= 0.7) {
      explanations.push("Good move accuracy");
    } else if (features.moveAccuracy < 0.5) {
      explanations.push("Consider improving move accuracy");
    }

    // Speed feedback
    const avgTime = features.avgDecisionTime || 2000;
    if (avgTime < 1000) {
      explanations.push("Quick decision making");
    } else if (avgTime > 5000) {
      explanations.push("Taking time to think strategically");
    }

    // Pattern feedback
    if (features.patternSuccessRate >= 0.8) {
      explanations.push("Strong pattern recognition");
    } else if (features.patternSuccessRate < 0.4) {
      explanations.push("Pattern recognition could improve");
    }

    // Consistency feedback
    if (features.consistencyScore >= 0.8) {
      explanations.push("Very consistent performance");
    } else if (features.consistencyScore < 0.4) {
      explanations.push("Performance varies - aim for consistency");
    }

    // Error feedback
    if (features.errorRate > 0.3) {
      explanations.push("Try to reduce error rate");
    } else if (features.errorRate < 0.1) {
      explanations.push("Low error rate - great precision");
    }

    if (explanations.length === 0) {
      return `Performance Index: ${Math.round(score)} (${tier})`;
    }

    return explanations.join(". ") + ".";
  }

  /**
   * Get model information
   * @returns {Object} Model info
   */
  getModelInfo() {
    return {
      modelType: this.modelType,
      isLoaded: this.isModelLoaded,
      features: Object.keys(this.featureScalers),
      tiers: this.skillTiers,
    };
  }
}
