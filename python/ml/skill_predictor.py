"""
Skill Predictor - Predicts player skill tier using Random Forest / XGBoost
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import pickle
import json
import os

# ML Libraries
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import classification_report, confusion_matrix
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

from .feature_processor import FeatureProcessor


class SkillPredictor:
    """
    Predicts player skill tier from gameplay features.
    Uses Random Forest or XGBoost classifier.
    
    Skill Tiers:
        0: Novice
        1: Beginner
        2: Intermediate
        3: Advanced
        4: Expert
    """
    
    SKILL_TIERS = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert']
    
    def __init__(self, model_type: str = 'random_forest'):
        """
        Initialize the skill predictor.
        
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
            raise ImportError("scikit-learn is required for Random Forest. Install with: pip install scikit-learn")
        if self.model_type == 'xgboost' and not XGBOOST_AVAILABLE:
            raise ImportError("XGBoost is required. Install with: pip install xgboost")
    
    def train(self, training_data: List[Dict], labels: List[int], 
              **hyperparams) -> Dict[str, Any]:
        """
        Train the skill prediction model.
        
        Args:
            training_data: List of feature dictionaries
            labels: List of skill tier labels (0-4)
            **hyperparams: Model hyperparameters
            
        Returns:
            Training results including metrics
        """
        if not training_data or not labels:
            raise ValueError("Training data and labels cannot be empty")
            
        if len(training_data) != len(labels):
            raise ValueError("Training data and labels must have same length")
        
        # Fit feature processor
        self.feature_processor.fit(training_data)
        
        # Transform features
        X = np.array([
            self.feature_processor.transform(d, feature_set='skill') 
            for d in training_data
        ])
        y = np.array(labels)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Create and train model
        if self.model_type == 'random_forest':
            self.model = self._create_random_forest(**hyperparams)
        else:
            self.model = self._create_xgboost(**hyperparams)
        
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        y_pred = self.model.predict(X_test)
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X, y, cv=5)
        
        # Feature importance
        if hasattr(self.model, 'feature_importances_'):
            importances = self.feature_processor.get_feature_importance_names(
                self.model.feature_importances_, 
                feature_set='skill'
            )
        else:
            importances = {}
        
        self.training_metadata = {
            'model_type': self.model_type,
            'n_samples': len(training_data),
            'n_features': X.shape[1],
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'feature_importances': importances,
            'classification_report': classification_report(y_test, y_pred, 
                                                           target_names=self.SKILL_TIERS,
                                                           output_dict=True)
        }
        
        return self.training_metadata
    
    def _create_random_forest(self, **params) -> 'RandomForestClassifier':
        """Create Random Forest classifier with given parameters."""
        default_params = {
            'n_estimators': 100,
            'max_depth': 10,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'random_state': 42,
            'n_jobs': -1
        }
        default_params.update(params)
        return RandomForestClassifier(**default_params)
    
    def _create_xgboost(self, **params) -> 'xgb.XGBClassifier':
        """Create XGBoost classifier with given parameters."""
        default_params = {
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1,
            'objective': 'multi:softmax',
            'num_class': 5,
            'random_state': 42,
            'n_jobs': -1,
            'eval_metric': 'mlogloss'
        }
        default_params.update(params)
        return xgb.XGBClassifier(**default_params)
    
    def predict(self, features: Dict) -> Dict[str, Any]:
        """
        Predict skill tier for given features.
        
        Args:
            features: Dictionary of gameplay features
            
        Returns:
            Prediction result with tier, probabilities, and confidence
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call train() first or load a trained model.")
        
        # Transform features
        X = self.feature_processor.transform(features, feature_set='skill').reshape(1, -1)
        
        # Predict
        tier_idx = int(self.model.predict(X)[0])
        
        # Get probabilities
        if hasattr(self.model, 'predict_proba'):
            probabilities = self.model.predict_proba(X)[0]
            proba_dict = {tier: float(prob) for tier, prob in 
                         zip(self.SKILL_TIERS, probabilities)}
            confidence = float(max(probabilities))
        else:
            proba_dict = {self.SKILL_TIERS[tier_idx]: 1.0}
            confidence = 0.8  # Default confidence for non-probabilistic models
        
        return {
            'skill_tier': self.SKILL_TIERS[tier_idx],
            'skill_tier_index': tier_idx,
            'probabilities': proba_dict,
            'confidence': confidence,
            'explanation': self._generate_explanation(features, tier_idx)
        }
    
    def predict_batch(self, features_list: List[Dict]) -> List[Dict[str, Any]]:
        """Predict skill tiers for multiple feature sets."""
        return [self.predict(f) for f in features_list]
    
    def _generate_explanation(self, features: Dict, tier_idx: int) -> str:
        """Generate human-readable explanation for prediction."""
        tier = self.SKILL_TIERS[tier_idx]
        
        explanations = []
        
        # Analyze key features
        if features.get('move_accuracy', 0) > 0.8:
            explanations.append("high move accuracy")
        elif features.get('move_accuracy', 0) < 0.4:
            explanations.append("needs accuracy improvement")
            
        if features.get('avg_decision_time', 5000) < 2000:
            explanations.append("quick decision making")
        elif features.get('avg_decision_time', 5000) > 6000:
            explanations.append("thoughtful but slow")
            
        if features.get('pattern_success_rate', 0) > 0.7:
            explanations.append("strong pattern recognition")
            
        if features.get('consistency_score', 0) > 0.8:
            explanations.append("very consistent performance")
        elif features.get('consistency_score', 0) < 0.4:
            explanations.append("inconsistent performance")
        
        if not explanations:
            explanations.append("balanced skill profile")
        
        return f"Predicted {tier} based on: {', '.join(explanations)}"
    
    def save(self, filepath: str):
        """Save trained model to file."""
        if not self.is_trained:
            raise RuntimeError("Cannot save untrained model")
            
        os.makedirs(os.path.dirname(filepath) or '.', exist_ok=True)
        
        # Save model
        model_path = filepath + '.pkl'
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        # Save feature processor
        processor_path = filepath + '_processor.json'
        self.feature_processor.save_params(processor_path)
        
        # Save metadata
        meta_path = filepath + '_meta.json'
        with open(meta_path, 'w') as f:
            json.dump({
                'model_type': self.model_type,
                'is_trained': self.is_trained,
                'training_metadata': self.training_metadata
            }, f, indent=2)
    
    def load(self, filepath: str):
        """Load trained model from file."""
        # Load model
        model_path = filepath + '.pkl'
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        
        # Load feature processor
        processor_path = filepath + '_processor.json'
        self.feature_processor.load_params(processor_path)
        
        # Load metadata
        meta_path = filepath + '_meta.json'
        with open(meta_path, 'r') as f:
            meta = json.load(f)
            self.model_type = meta['model_type']
            self.is_trained = meta['is_trained']
            self.training_metadata = meta.get('training_metadata', {})
