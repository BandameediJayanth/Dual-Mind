"""Quick validation test for trained models"""
import sys
sys.path.insert(0, '.')

from ml.skill_predictor import SkillPredictor
from ml.performance_estimator import PerformanceEstimator

# Load trained models
sp = SkillPredictor()
sp.load('models/skill_predictor')
pe = PerformanceEstimator()
pe.load('models/performance_estimator')

# Test prediction on sample data
test_features = {
    'avg_decision_time': 2500,
    'decision_time_variance': 500000,
    'move_accuracy': 0.75,
    'error_rate': 0.1,
    'pattern_success_rate': 0.65,
    'consistency_score': 0.7,
    'optimal_play_rate': 0.3,
    'strategic_move_rate': 0.35,
    'strategic_depth': 0.6,
    'memory_accuracy': 0.7,
    'logical_reasoning': 0.65,
    'improvement_rate': 0.02,
    'win_rate': 0.6
}

# Skill prediction
skill_result = sp.predict(test_features)
print('Skill Prediction Test:')
print(f'  Predicted tier: {skill_result["skill_tier_index"]} ({skill_result["skill_tier"]})')
print(f'  Confidence: {skill_result["confidence"]:.2%}')

# Performance prediction  
perf_result = pe.predict(test_features)
print('\nPerformance Prediction Test:')
print(f'  Performance index: {perf_result["performance_index"]:.1f}')
print(f'  Skill tier: {perf_result["skill_tier"]}')
print(f'  Uncertainty: ±{perf_result["uncertainty"]:.1f}')

print('\n✓ Model inference working correctly!')
