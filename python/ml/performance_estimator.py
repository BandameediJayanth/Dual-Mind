"""
Performance Estimator - Estimates player performance index using Random Forest / XGBoost
"""

import numpy as np
from typing import Dict, List, Optional, Any
import pickle
import json
import os

# ML Libraries
try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

from .feature_processor import FeatureProcessor


class PerformanceEstimator:
    """
    Estimates player performance index (0-100) from gameplay features.
    Uses Random Forest or XGBoost regressor.
    """
    
    def __init__(self, model_type: str = 'random_forest'):
        """
        Initialize the performance estimator.
        
        Args:
            model_type: 'random_forest' or 'xgboost'
        """
        self.model_type = model_type
        self.model = None
        self.feature_processor = FeatureProcessor()
        self.is_trained = False
        self.training_metadata = {}
        
        self._validate_dependencies()
    
    def _validate_dependencies(self):
        """Validate that required ML libraries are available."""
        if self.model_type == 'random_forest' and not SKLEARN_AVAILABLE:
            raise ImportError("scikit-learn is required. Install with: pip install scikit-learn")
        if self.model_type == 'xgboost' and not XGBOOST_AVAILABLE:
            raise ImportError("XGBoost is required. Install with: pip install xgboost")
    
    def train(self, training_data: List[Dict], scores: List[float],
              **hyperparams) -> Dict[str, Any]:
        """
        Train the performance estimation model.
        
        Args:
            training_data: List of feature dictionaries
            scores: List of performance scores (0-100)
            **hyperparams: Model hyperparameters
            
        Returns:
            Training results including metrics
        """
        if not training_data or not scores:
            raise ValueError("Training data and scores cannot be empty")
            
        if len(training_data) != len(scores):
            raise ValueError("Training data and scores must have same length")
        
        # Fit feature processor
        self.feature_processor.fit(training_data)
        
        # Transform features
        X = np.array([
            self.feature_processor.transform(d, feature_set='performance') 
            for d in training_data
        ])
        y = np.array(scores)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Create and train model
        if self.model_type == 'random_forest':
            self.model = self._create_random_forest(**hyperparams)
        else:
            self.model = self._create_xgboost(**hyperparams)
        
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        
        # Metrics
        train_r2 = r2_score(y_train, y_train_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        test_mse = mean_squared_error(y_test, y_test_pred)
        test_mae = mean_absolute_error(y_test, y_test_pred)
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X, y, cv=5, scoring='r2')
        
        # Feature importance
        if hasattr(self.model, 'feature_importances_'):
            importances = self.feature_processor.get_feature_importance_names(
                self.model.feature_importances_, 
                feature_set='performance'
            )
        else:
            importances = {}
        
        self.training_metadata = {
            'model_type': self.model_type,
            'n_samples': len(training_data),
            'n_features': X.shape[1],
            'train_r2': float(train_r2),
            'test_r2': float(test_r2),
            'test_mse': float(test_mse),
            'test_mae': float(test_mae),
            'test_rmse': float(np.sqrt(test_mse)),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'feature_importances': importances
        }
        
        return self.training_metadata
    
    def _create_random_forest(self, **params) -> 'RandomForestRegressor':
        """Create Random Forest regressor with given parameters."""
        default_params = {
            'n_estimators': 100,
            'max_depth': 10,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'random_state': 42,
            'n_jobs': -1
        }
        default_params.update(params)
        return RandomForestRegressor(**default_params)
    
    def _create_xgboost(self, **params) -> 'xgb.XGBRegressor':
        """Create XGBoost regressor with given parameters."""
        default_params = {
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1,
            'objective': 'reg:squarederror',
            'random_state': 42,
            'n_jobs': -1
        }
        default_params.update(params)
        return xgb.XGBRegressor(**default_params)
    
    def predict(self, features: Dict) -> Dict[str, Any]:
        """
        Estimate performance index for given features.
        
        Args:
            features: Dictionary of gameplay features
            
        Returns:
            Prediction result with performance index and breakdown
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call train() first or load a trained model.")
        
        # Transform features
        X = self.feature_processor.transform(features, feature_set='performance').reshape(1, -1)
        
        # Predict
        score = float(self.model.predict(X)[0])
        
        # Clamp to valid range
        score = max(0.0, min(100.0, score))
        
        # Estimate uncertainty using prediction variance for RF
        if self.model_type == 'random_forest' and hasattr(self.model, 'estimators_'):
            predictions = [tree.predict(X)[0] for tree in self.model.estimators_]
            uncertainty = float(np.std(predictions))
        else:
            uncertainty = 5.0  # Default uncertainty
        
        # Calculate skill tier from performance
        skill_tier = self._score_to_tier(score)
        
        return {
            'performance_index': round(score, 1),
            'skill_tier': skill_tier,
            'uncertainty': round(uncertainty, 2),
            'confidence_interval': {
                'low': max(0, round(score - 2 * uncertainty, 1)),
                'high': min(100, round(score + 2 * uncertainty, 1))
            },
            'component_scores': self._calculate_component_scores(features),
            'explanation': self._generate_explanation(features, score)
        }
    
    def predict_batch(self, features_list: List[Dict]) -> List[Dict[str, Any]]:
        """Estimate performance for multiple feature sets."""
        return [self.predict(f) for f in features_list]
    
    def _score_to_tier(self, score: float) -> str:
        """Convert performance score to skill tier."""
        if score >= 90:
            return 'Expert'
        elif score >= 75:
            return 'Advanced'
        elif score >= 55:
            return 'Intermediate'
        elif score >= 35:
            return 'Beginner'
        else:
            return 'Novice'
    
    def _calculate_component_scores(self, features: Dict) -> Dict[str, float]:
        """Calculate component-wise performance scores."""
        components = {}
        
        # Speed component (based on decision time)
        avg_time = features.get('avg_decision_time', 3000)
        if avg_time < 1500:
            components['speed'] = 90
        elif avg_time < 3000:
            components['speed'] = 70
        elif avg_time < 5000:
            components['speed'] = 50
        else:
            components['speed'] = 30
            
        # Accuracy component
        accuracy = features.get('move_accuracy', 0.5)
        components['accuracy'] = round(accuracy * 100, 1)
        
        # Consistency component
        consistency = features.get('consistency_score', 0.5)
        components['consistency'] = round(consistency * 100, 1)
        
        # Strategy component
        strategy = features.get('pattern_success_rate', 0.5) * 0.6 + \
                   features.get('optimal_play_rate', 0.5) * 0.4
        components['strategy'] = round(strategy * 100, 1)
        
        return components
    
    def _generate_explanation(self, features: Dict, score: float) -> str:
        """Generate human-readable explanation for the estimate."""
        tier = self._score_to_tier(score)
        
        strengths = []
        weaknesses = []
        
        # Analyze features
        if features.get('move_accuracy', 0) > 0.75:
            strengths.append("high accuracy")
        elif features.get('move_accuracy', 0) < 0.4:
            weaknesses.append("accuracy")
            
        if features.get('avg_decision_time', 5000) < 2000:
            strengths.append("quick thinking")
        elif features.get('avg_decision_time', 5000) > 6000:
            weaknesses.append("decision speed")
            
        if features.get('consistency_score', 0) > 0.75:
            strengths.append("consistency")
        elif features.get('consistency_score', 0) < 0.4:
            weaknesses.append("consistency")
            
        if features.get('improvement_rate', 0) > 0.1:
            strengths.append("rapid improvement")
        
        explanation = f"Performance Index: {round(score)} ({tier}). "
        
        if strengths:
            explanation += f"Strengths: {', '.join(strengths)}. "
        if weaknesses:
            explanation += f"Areas to improve: {', '.join(weaknesses)}."
        
        return explanation
    
    def save(self, filepath: str):
        """Save trained model to file."""
        if not self.is_trained:
            raise RuntimeError("Cannot save untrained model")
            
        os.makedirs(os.path.dirname(filepath) or '.', exist_ok=True)
        
        # Save model
        with open(filepath + '.pkl', 'wb') as f:
            pickle.dump(self.model, f)
        
        # Save feature processor
        self.feature_processor.save_params(filepath + '_processor.json')
        
        # Save metadata
        with open(filepath + '_meta.json', 'w') as f:
            json.dump({
                'model_type': self.model_type,
                'is_trained': self.is_trained,
                'training_metadata': self.training_metadata
            }, f, indent=2)
    
    def load(self, filepath: str):
        """Load trained model from file."""
        with open(filepath + '.pkl', 'rb') as f:
            self.model = pickle.load(f)
        
        self.feature_processor.load_params(filepath + '_processor.json')
        
        with open(filepath + '_meta.json', 'r') as f:
            meta = json.load(f)
            self.model_type = meta['model_type']
            self.is_trained = meta['is_trained']
            self.training_metadata = meta.get('training_metadata', {})
