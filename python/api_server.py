"""
ML API Server - Flask REST API for ML inference
Provides endpoints for skill prediction, performance estimation, and trend analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
import traceback
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.skill_predictor import SkillPredictor
from ml.performance_estimator import PerformanceEstimator
from ml.trend_analyzer import TrendAnalyzer

app = Flask(__name__)
CORS(app)  # Enable CORS for JavaScript client

# Model instances
skill_predictor = None
performance_estimator = None
trend_analyzer = TrendAnalyzer()

# Model directory
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')


def load_models():
    """Load trained models on startup."""
    global skill_predictor, performance_estimator
    
    # Try to load skill predictor
    skill_model_path = os.path.join(MODEL_DIR, 'skill_predictor')
    if os.path.exists(skill_model_path + '.pkl'):
        skill_predictor = SkillPredictor()
        skill_predictor.load(skill_model_path)
        print(f"✓ Loaded skill predictor from {skill_model_path}")
    else:
        print(f"⚠ Skill predictor model not found at {skill_model_path}")
        skill_predictor = None
    
    # Try to load performance estimator
    perf_model_path = os.path.join(MODEL_DIR, 'performance_estimator')
    if os.path.exists(perf_model_path + '.pkl'):
        performance_estimator = PerformanceEstimator()
        performance_estimator.load(perf_model_path)
        print(f"✓ Loaded performance estimator from {perf_model_path}")
    else:
        print(f"⚠ Performance estimator model not found at {perf_model_path}")
        performance_estimator = None


@app.route('/api/ml/health', methods=['GET'])
def health_check():
    """Health check endpoint for service availability."""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'models': {
            'skill_predictor': skill_predictor is not None and skill_predictor.is_trained,
            'performance_estimator': performance_estimator is not None and performance_estimator.is_trained,
            'trend_analyzer': True
        }
    })


@app.route('/api/ml/predict/skill', methods=['POST'])
def predict_skill():
    """
    Predict skill tier from gameplay features.
    
    Request body:
    {
        "features": {
            "avg_decision_time": 2500,
            "move_accuracy": 0.75,
            "error_rate": 0.1,
            ...
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'features' not in data:
            return jsonify({'error': 'Missing features in request body'}), 400
        
        features = data['features']
        
        if skill_predictor is None or not skill_predictor.is_trained:
            # Return rule-based fallback prediction
            return jsonify({
                'prediction': _fallback_skill_prediction(features),
                'model_type': 'fallback',
                'warning': 'Using fallback prediction - trained model not available'
            })
        
        result = skill_predictor.predict(features)
        result['model_type'] = skill_predictor.model_type
        
        return jsonify({'prediction': result})
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/ml/predict/performance', methods=['POST'])
def predict_performance():
    """
    Estimate performance index from gameplay features.
    
    Request body:
    {
        "features": {
            "avg_decision_time": 2500,
            "move_accuracy": 0.75,
            ...
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'features' not in data:
            return jsonify({'error': 'Missing features in request body'}), 400
        
        features = data['features']
        
        if performance_estimator is None or not performance_estimator.is_trained:
            # Return rule-based fallback estimation
            return jsonify({
                'prediction': _fallback_performance_estimation(features),
                'model_type': 'fallback',
                'warning': 'Using fallback estimation - trained model not available'
            })
        
        result = performance_estimator.predict(features)
        result['model_type'] = performance_estimator.model_type
        
        return jsonify({'prediction': result})
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/ml/analyze/trends', methods=['POST'])
def analyze_trends():
    """
    Analyze performance trends from session history.
    
    Request body:
    {
        "sessions": [
            {"timestamp": 1234567890, "performance_index": 65, "skill_tier": "Intermediate"},
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'sessions' not in data:
            return jsonify({'error': 'Missing sessions in request body'}), 400
        
        sessions = data['sessions']
        result = trend_analyzer.analyze(sessions)
        
        return jsonify({'analysis': result})
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/ml/predict/batch', methods=['POST'])
def predict_batch():
    """
    Batch prediction for multiple feature sets.
    
    Request body:
    {
        "features_list": [
            {"avg_decision_time": 2500, "move_accuracy": 0.75, ...},
            ...
        ],
        "prediction_type": "skill" | "performance"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'features_list' not in data:
            return jsonify({'error': 'Missing features_list in request body'}), 400
        
        features_list = data['features_list']
        prediction_type = data.get('prediction_type', 'skill')
        
        results = []
        
        for features in features_list:
            if prediction_type == 'skill':
                if skill_predictor and skill_predictor.is_trained:
                    result = skill_predictor.predict(features)
                else:
                    result = _fallback_skill_prediction(features)
            else:
                if performance_estimator and performance_estimator.is_trained:
                    result = performance_estimator.predict(features)
                else:
                    result = _fallback_performance_estimation(features)
            
            results.append(result)
        
        return jsonify({'predictions': results})
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


def _fallback_skill_prediction(features: dict) -> dict:
    """Rule-based fallback for skill prediction."""
    # Calculate weighted score
    weights = {
        'move_accuracy': 0.25,
        'pattern_success_rate': 0.20,
        'consistency_score': 0.15,
        'optimal_play_rate': 0.20,
        'decision_speed': 0.10,
        'error_penalty': 0.10
    }
    
    # Decision speed score
    avg_time = features.get('avg_decision_time', 3000)
    if avg_time < 500:
        decision_speed = 0.5  # Too fast
    elif avg_time < 1500:
        decision_speed = 1.0
    elif avg_time < 3000:
        decision_speed = 0.8
    elif avg_time < 5000:
        decision_speed = 0.6
    else:
        decision_speed = 0.4
    
    error_penalty = 1 - features.get('error_rate', 0.2)
    
    # Calculate score
    score = 0
    score += features.get('move_accuracy', 0.5) * weights['move_accuracy'] * 100
    score += features.get('pattern_success_rate', 0.5) * weights['pattern_success_rate'] * 100
    score += features.get('consistency_score', 0.5) * weights['consistency_score'] * 100
    score += features.get('optimal_play_rate', 0.3) * weights['optimal_play_rate'] * 100
    score += decision_speed * weights['decision_speed'] * 100
    score += error_penalty * weights['error_penalty'] * 100
    
    # Determine tier
    tiers = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert']
    if score >= 85:
        tier_idx = 4
    elif score >= 70:
        tier_idx = 3
    elif score >= 50:
        tier_idx = 2
    elif score >= 30:
        tier_idx = 1
    else:
        tier_idx = 0
    
    return {
        'skill_tier': tiers[tier_idx],
        'skill_tier_index': tier_idx,
        'confidence': 0.6,
        'probabilities': {tier: 0.1 for tier in tiers},
        'explanation': f"Fallback prediction based on {score:.0f} score"
    }


def _fallback_performance_estimation(features: dict) -> dict:
    """Rule-based fallback for performance estimation."""
    # Similar calculation
    score = 50  # Start at middle
    
    # Accuracy contribution (0-25 points)
    accuracy = features.get('move_accuracy', 0.5)
    score += (accuracy - 0.5) * 50
    
    # Speed contribution (0-15 points)
    avg_time = features.get('avg_decision_time', 3000)
    if avg_time < 2000:
        score += 10
    elif avg_time < 4000:
        score += 5
    elif avg_time > 6000:
        score -= 5
    
    # Consistency contribution (0-10 points)
    consistency = features.get('consistency_score', 0.5)
    score += (consistency - 0.5) * 20
    
    # Clamp score
    score = max(0, min(100, score))
    
    # Determine tier
    if score >= 90:
        tier = 'Expert'
    elif score >= 75:
        tier = 'Advanced'
    elif score >= 55:
        tier = 'Intermediate'
    elif score >= 35:
        tier = 'Beginner'
    else:
        tier = 'Novice'
    
    return {
        'performance_index': round(score, 1),
        'skill_tier': tier,
        'uncertainty': 10.0,
        'confidence_interval': {
            'low': max(0, score - 15),
            'high': min(100, score + 15)
        },
        'explanation': f"Fallback estimation: {score:.0f} ({tier})"
    }


if __name__ == '__main__':
    print("🚀 Starting ML API Server...")
    
    # Create models directory if needed
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Load trained models
    load_models()
    
    # Run server
    port = int(os.environ.get('ML_API_PORT', 5000))
    debug = os.environ.get('ML_API_DEBUG', 'true').lower() == 'true'
    
    print(f"📡 API running on http://localhost:{port}")
    print(f"   Health check: http://localhost:{port}/api/ml/health")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
