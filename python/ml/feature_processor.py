"""
Feature Processor - Prepares features for ML models
Handles normalization, scaling, and feature engineering
"""

import numpy as np
from typing import Dict, List, Optional, Tuple


class FeatureProcessor:
    """Processes raw gameplay features for ML model input."""
    
    # Feature definitions with normalization parameters
    FEATURE_DEFINITIONS = {
        # Temporal features
        'avg_decision_time': {'min': 500, 'max': 10000, 'type': 'numeric'},
        'decision_time_variance': {'min': 0, 'max': 5000000, 'type': 'numeric'},
        'time_pressure_performance': {'min': 0, 'max': 1, 'type': 'numeric'},
        
        # Accuracy features
        'move_accuracy': {'min': 0, 'max': 1, 'type': 'numeric'},
        'error_rate': {'min': 0, 'max': 1, 'type': 'numeric'},
        'optimal_play_rate': {'min': 0, 'max': 1, 'type': 'numeric'},
        
        # Pattern features
        'pattern_success_rate': {'min': 0, 'max': 1, 'type': 'numeric'},
        'pattern_complexity': {'min': 0, 'max': 5, 'type': 'numeric'},
        
        # Consistency features
        'consistency_score': {'min': 0, 'max': 1, 'type': 'numeric'},
        'improvement_rate': {'min': -0.5, 'max': 0.5, 'type': 'numeric'},
        
        # Game-specific features
        'strategic_depth': {'min': 0, 'max': 1, 'type': 'numeric'},
        'memory_accuracy': {'min': 0, 'max': 1, 'type': 'numeric'},
        'logical_reasoning': {'min': 0, 'max': 1, 'type': 'numeric'},
        'arithmetic_speed': {'min': 0, 'max': 1, 'type': 'numeric'},
        'vocabulary_score': {'min': 0, 'max': 1, 'type': 'numeric'},
        
        # Session features
        'session_duration': {'min': 60, 'max': 3600, 'type': 'numeric'},
        'games_played': {'min': 1, 'max': 50, 'type': 'numeric'},
        'win_rate': {'min': 0, 'max': 1, 'type': 'numeric'},
    }
    
    # Features used for skill prediction
    SKILL_FEATURES = [
        'avg_decision_time', 'move_accuracy', 'error_rate', 'optimal_play_rate',
        'pattern_success_rate', 'consistency_score', 'strategic_depth',
        'memory_accuracy', 'logical_reasoning'
    ]
    
    # Features used for performance estimation
    PERFORMANCE_FEATURES = [
        'avg_decision_time', 'decision_time_variance', 'move_accuracy',
        'error_rate', 'pattern_success_rate', 'consistency_score',
        'improvement_rate', 'win_rate'
    ]
    
    def __init__(self):
        """Initialize the feature processor."""
        self.fitted = False
        self.scaler_params = {}
        
    def fit(self, training_data: List[Dict]) -> 'FeatureProcessor':
        """
        Fit the processor on training data to learn normalization parameters.
        
        Args:
            training_data: List of feature dictionaries
            
        Returns:
            self for chaining
        """
        if not training_data:
            raise ValueError("Training data cannot be empty")
            
        # Calculate statistics for each feature
        for feature_name in self.FEATURE_DEFINITIONS.keys():
            raw_values = [d.get(feature_name) for d in training_data if d.get(feature_name) is not None]
            # Keep only numeric inputs to satisfy numpy expectations and type checkers
            values = [float(v) for v in raw_values if isinstance(v, (int, float))]
            
            if values:
                self.scaler_params[feature_name] = {
                    'mean': np.mean(values),
                    'std': max(np.std(values), 1e-6),  # Prevent division by zero
                    'min': np.min(values),
                    'max': np.max(values)
                }
            else:
                # Use defaults from definition
                defn = self.FEATURE_DEFINITIONS[feature_name]
                self.scaler_params[feature_name] = {
                    'mean': (defn['min'] + defn['max']) / 2,
                    'std': (defn['max'] - defn['min']) / 4,
                    'min': defn['min'],
                    'max': defn['max']
                }
        
        self.fitted = True
        return self
    
    def transform(self, features: Dict, feature_set: str = 'skill') -> np.ndarray:
        """
        Transform raw features into normalized feature vector.
        
        Args:
            features: Dictionary of raw feature values
            feature_set: 'skill' or 'performance' - which features to use
            
        Returns:
            Normalized feature vector as numpy array
        """
        if feature_set == 'skill':
            feature_names = self.SKILL_FEATURES
        elif feature_set == 'performance':
            feature_names = self.PERFORMANCE_FEATURES
        else:
            raise ValueError(f"Unknown feature set: {feature_set}")
            
        vector = []
        
        for name in feature_names:
            value = features.get(name)
            
            if value is None:
                # Use default value (normalized 0)
                vector.append(0.0)
            else:
                # Normalize using min-max scaling
                normalized = self._normalize_value(name, value)
                vector.append(normalized)
                
        return np.array(vector, dtype=np.float32)
    
    def _normalize_value(self, feature_name: str, value: float) -> float:
        """Normalize a single feature value to [0, 1] range."""
        if self.fitted and feature_name in self.scaler_params:
            params = self.scaler_params[feature_name]
        else:
            params = self.FEATURE_DEFINITIONS.get(feature_name, {'min': 0, 'max': 1})
            
        min_val = params.get('min', 0)
        max_val = params.get('max', 1)
        
        # Min-max normalization
        if max_val - min_val > 0:
            normalized = (value - min_val) / (max_val - min_val)
        else:
            normalized = 0.5
            
        # Clip to [0, 1]
        return max(0.0, min(1.0, normalized))
    
    def extract_feature_names(self, feature_set: str = 'skill') -> List[str]:
        """Get the list of feature names for a feature set."""
        if feature_set == 'skill':
            return self.SKILL_FEATURES.copy()
        elif feature_set == 'performance':
            return self.PERFORMANCE_FEATURES.copy()
        else:
            raise ValueError(f"Unknown feature set: {feature_set}")
    
    def get_feature_importance_names(self, importances: np.ndarray, 
                                      feature_set: str = 'skill') -> Dict[str, float]:
        """Map feature importances to feature names."""
        names = self.extract_feature_names(feature_set)
        return {name: float(imp) for name, imp in zip(names, importances)}
    
    def validate_features(self, features: Dict) -> Tuple[bool, List[str]]:
        """
        Validate that required features are present.
        
        Returns:
            Tuple of (is_valid, list of missing features)
        """
        missing = []
        for name in self.SKILL_FEATURES:
            if name not in features or features[name] is None:
                missing.append(name)
                
        return len(missing) == 0, missing
    
    def save_params(self, filepath: str):
        """Save normalization parameters to file."""
        import json
        with open(filepath, 'w') as f:
            json.dump({
                'scaler_params': self.scaler_params,
                'fitted': self.fitted
            }, f, indent=2)
    
    def load_params(self, filepath: str):
        """Load normalization parameters from file."""
        import json
        with open(filepath, 'r') as f:
            data = json.load(f)
            self.scaler_params = data['scaler_params']
            self.fitted = data['fitted']
