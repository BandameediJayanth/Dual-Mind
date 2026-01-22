"""
ML Module - Machine Learning for Game Suite
Handles skill tier prediction, performance estimation, and trend analysis
Using Random Forest and XGBoost models
"""

from .feature_processor import FeatureProcessor
from .skill_predictor import SkillPredictor
from .performance_estimator import PerformanceEstimator
from .trend_analyzer import TrendAnalyzer

__all__ = [
    'FeatureProcessor',
    'SkillPredictor', 
    'PerformanceEstimator',
    'TrendAnalyzer'
]
