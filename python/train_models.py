"""
Training Script - Train ML models for the Game Suite
Generates synthetic training data and trains Random Forest / XGBoost models

Supports:
- Synthetic data generation (default)
- Loading from CSV files (--data-file option)
"""

import os
import sys
import json
import argparse
import csv
import random
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple, List, Dict

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml.skill_predictor import SkillPredictor
from ml.performance_estimator import PerformanceEstimator


# Feature columns expected in CSV
FEATURE_COLUMNS = [
    'avg_decision_time', 'decision_time_variance', 'move_accuracy', 'error_rate',
    'pattern_success_rate', 'consistency_score', 'optimal_play_rate',
    'strategic_move_rate', 'strategic_depth', 'memory_accuracy',
    'logical_reasoning', 'improvement_rate', 'win_rate'
]


def load_data_from_csv(csv_path: str, max_samples: Optional[int] = None, 
                       shuffle: bool = True, seed: int = 42) -> Tuple[List, List, List]:
    """
    Load training data from CSV file.
    
    Expected columns:
    - Feature columns (see FEATURE_COLUMNS)
    - skill_tier: integer 0-4
    - performance_score: float 0-100
    
    Args:
        csv_path: Path to CSV file
        max_samples: Maximum samples to load (None = all)
        shuffle: Whether to shuffle data (important for balanced sampling)
        seed: Random seed for reproducibility
    """
    print(f"   Loading data from: {csv_path}")
    
    all_data = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Extract features
            features = {}
            for col in FEATURE_COLUMNS:
                if col in row:
                    try:
                        features[col] = float(row[col])
                    except ValueError:
                        features[col] = 0.0
            
            # Extract labels
            skill_tier = int(row.get('skill_tier', 2))
            perf_score = float(row.get('performance_score', 50.0))
            
            all_data.append((features, skill_tier, perf_score))
    
    # Shuffle for balanced class distribution when sampling
    if shuffle:
        random.seed(seed)
        random.shuffle(all_data)
    
    # Limit samples if needed
    if max_samples and len(all_data) > max_samples:
        all_data = all_data[:max_samples]
    
    # Unpack into separate lists
    training_data = [d[0] for d in all_data]
    skill_labels = [d[1] for d in all_data]
    performance_scores = [d[2] for d in all_data]
    
    print(f"   Loaded {len(training_data)} samples from CSV (shuffled={shuffle})")
    return training_data, skill_labels, performance_scores


def generate_synthetic_data(n_samples: int = 1000, seed: int = 42) -> tuple:
    """
    Generate synthetic training data.
    
    In production, this should be replaced with real gameplay data.
    """
    np.random.seed(seed)
    
    training_data = []
    skill_labels = []
    performance_scores = []
    
    # Define tier profiles
    tier_profiles = {
        0: {  # Novice
            'avg_decision_time': (6000, 2000),
            'move_accuracy': (0.3, 0.1),
            'error_rate': (0.4, 0.15),
            'pattern_success_rate': (0.25, 0.1),
            'consistency_score': (0.3, 0.1),
            'optimal_play_rate': (0.03, 0.03),
            'strategic_move_rate': (0.03, 0.03),
            'strategic_depth': (0.2, 0.1),
            'memory_accuracy': (0.3, 0.15),
            'logical_reasoning': (0.25, 0.1),
        },
        1: {  # Beginner
            'avg_decision_time': (5000, 1500),
            'move_accuracy': (0.45, 0.1),
            'error_rate': (0.3, 0.1),
            'pattern_success_rate': (0.4, 0.1),
            'consistency_score': (0.45, 0.1),
            'optimal_play_rate': (0.10, 0.06),
            'strategic_move_rate': (0.10, 0.06),
            'strategic_depth': (0.35, 0.1),
            'memory_accuracy': (0.45, 0.15),
            'logical_reasoning': (0.4, 0.1),
        },
        2: {  # Intermediate
            'avg_decision_time': (3500, 1200),
            'move_accuracy': (0.6, 0.1),
            'error_rate': (0.2, 0.08),
            'pattern_success_rate': (0.55, 0.1),
            'consistency_score': (0.6, 0.1),
            'optimal_play_rate': (0.22, 0.08),
            'strategic_move_rate': (0.22, 0.08),
            'strategic_depth': (0.5, 0.1),
            'memory_accuracy': (0.6, 0.12),
            'logical_reasoning': (0.55, 0.1),
        },
        3: {  # Advanced
            'avg_decision_time': (2500, 800),
            'move_accuracy': (0.75, 0.08),
            'error_rate': (0.12, 0.05),
            'pattern_success_rate': (0.7, 0.1),
            'consistency_score': (0.75, 0.08),
            'optimal_play_rate': (0.38, 0.08),
            'strategic_move_rate': (0.38, 0.08),
            'strategic_depth': (0.7, 0.1),
            'memory_accuracy': (0.75, 0.1),
            'logical_reasoning': (0.72, 0.08),
        },
        4: {  # Expert
            'avg_decision_time': (1800, 500),
            'move_accuracy': (0.88, 0.05),
            'error_rate': (0.05, 0.03),
            'pattern_success_rate': (0.85, 0.08),
            'consistency_score': (0.88, 0.05),
            'optimal_play_rate': (0.55, 0.08),
            'strategic_move_rate': (0.55, 0.08),
            'strategic_depth': (0.85, 0.07),
            'memory_accuracy': (0.88, 0.06),
            'logical_reasoning': (0.86, 0.05),
        }
    }
    
    # Distribution of skill tiers (slightly more beginners/intermediates)
    tier_distribution = [0.15, 0.25, 0.30, 0.20, 0.10]
    
    for _ in range(n_samples):
        # Sample skill tier
        tier = np.random.choice(5, p=tier_distribution)
        profile = tier_profiles[tier]
        
        # Generate features with noise
        features = {}
        for feat_name, (mean, std) in profile.items():
            value = np.random.normal(mean, std)
            
            # Clamp to valid ranges
            if feat_name == 'avg_decision_time':
                value = max(500, min(10000, value))
            else:
                value = max(0, min(1, value))
            
            features[feat_name] = value
        
        # Add some derived features
        features['decision_time_variance'] = np.random.uniform(100000, 3000000)
        features['improvement_rate'] = np.random.normal(0.02, 0.05)
        features['win_rate'] = np.clip(np.random.normal(0.3 + tier * 0.15, 0.1), 0, 1)
        
        # Calculate performance score (correlated with tier but with noise)
        base_score = 20 + tier * 18  # 20, 38, 56, 74, 92 base scores
        noise = np.random.normal(0, 5)
        performance_score = np.clip(base_score + noise, 0, 100)
        
        training_data.append(features)
        skill_labels.append(tier)
        performance_scores.append(performance_score)
    
    return training_data, skill_labels, performance_scores


def train_models(output_dir: str, model_type: str = 'random_forest',
                 n_samples: Optional[int] = 1000, data_file: Optional[str] = None):
    """
    Train and save ML models.
    
    Uses stratified 80/20 train/test split with 5-fold cross-validation.
    This approach is standard for IEEE publications.
    """
    
    print(f"\n{'='*60}")
    print(f"Training ML Models for Game Suite")
    print(f"{'='*60}")
    print(f"Model type: {model_type}")
    if data_file:
        print(f"Data source: {data_file}")
    else:
        print(f"Training samples: {n_samples} (synthetic)")
    print(f"Output directory: {output_dir}")
    print(f"Split: 80% train / 20% test + 5-fold CV")
    print(f"{'='*60}\n")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Load or generate training data
    if data_file:
        print("📊 Loading training data from CSV...")
        training_data, skill_labels, performance_scores = load_data_from_csv(data_file, n_samples)
    else:
        print("📊 Generating synthetic training data...")
        # Default to 1000 samples if not specified for synthetic data
        sample_count = n_samples if n_samples is not None else 1000
        training_data, skill_labels, performance_scores = generate_synthetic_data(sample_count)
    
    print(f"   Total samples: {len(training_data)}")
    
    # Print class distribution
    tier_counts = {}
    for tier in skill_labels:
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
    tier_names = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert']
    print("   Skill tier distribution:")
    for tier in sorted(tier_counts.keys()):
        pct = tier_counts[tier] / len(skill_labels) * 100
        print(f"     {tier_names[tier]}: {tier_counts[tier]} ({pct:.1f}%)")
    
    # Train skill predictor
    print("\n🎯 Training Skill Predictor...")
    skill_predictor = SkillPredictor(model_type=model_type)
    skill_results = skill_predictor.train(training_data, skill_labels)
    
    print(f"   Training Accuracy: {skill_results['train_accuracy']:.3f}")
    print(f"   Test Accuracy: {skill_results['test_accuracy']:.3f}")
    print(f"   CV Score: {skill_results['cv_mean']:.3f} ± {skill_results['cv_std']:.3f}")
    
    print("\n   Feature Importances:")
    sorted_features = sorted(
        skill_results['feature_importances'].items(),
        key=lambda x: x[1],
        reverse=True
    )
    for name, importance in sorted_features[:5]:
        print(f"     - {name}: {importance:.3f}")
    
    # Save skill predictor
    skill_path = os.path.join(output_dir, 'skill_predictor')
    skill_predictor.save(skill_path)
    print(f"\n   ✓ Saved to {skill_path}")
    
    # Train performance estimator
    print("\n📈 Training Performance Estimator...")
    perf_estimator = PerformanceEstimator(model_type=model_type)
    perf_results = perf_estimator.train(training_data, performance_scores)
    
    print(f"   Training R²: {perf_results['train_r2']:.3f}")
    print(f"   Test R²: {perf_results['test_r2']:.3f}")
    print(f"   Test RMSE: {perf_results['test_rmse']:.2f}")
    print(f"   Test MAE: {perf_results['test_mae']:.2f}")
    print(f"   CV Score: {perf_results['cv_mean']:.3f} ± {perf_results['cv_std']:.3f}")
    
    print("\n   Feature Importances:")
    sorted_features = sorted(
        perf_results['feature_importances'].items(),
        key=lambda x: x[1],
        reverse=True
    )
    for name, importance in sorted_features[:5]:
        print(f"     - {name}: {importance:.3f}")
    
    # Save performance estimator
    perf_path = os.path.join(output_dir, 'performance_estimator')
    perf_estimator.save(perf_path)
    print(f"\n   ✓ Saved to {perf_path}")
    
    # Save training summary
    summary = {
        'training_date': datetime.now().isoformat(),
        'model_type': model_type,
        'n_samples': len(training_data),
        'data_source': data_file if data_file else 'synthetic',
        'skill_predictor': {
            'test_accuracy': skill_results['test_accuracy'],
            'cv_score': skill_results['cv_mean'],
            'cv_std': skill_results['cv_std']
        },
        'performance_estimator': {
            'test_r2': perf_results['test_r2'],
            'test_rmse': perf_results['test_rmse'],
            'test_mae': perf_results['test_mae']
        },
        'tier_distribution': tier_counts
    }
    
    summary_path = os.path.join(output_dir, 'training_summary.json')
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n{'='*60}")
    print("✅ Training Complete!")
    print(f"{'='*60}")
    print(f"\nModels saved to: {output_dir}")
    print(f"  - skill_predictor.pkl")
    print(f"  - performance_estimator.pkl")
    print(f"  - training_summary.json")
    
    return summary


def main():
    parser = argparse.ArgumentParser(
        description='Train ML models for Game Suite'
    )
    parser.add_argument(
        '--output', '-o',
        default='models',
        help='Output directory for trained models'
    )
    parser.add_argument(
        '--model-type', '-m',
        choices=['random_forest', 'xgboost'],
        default='random_forest',
        help='Type of ML model to train'
    )
    parser.add_argument(
        '--samples', '-n',
        type=int,
        default=None,
        help='Maximum number of training samples (default: all available)'
    )
    parser.add_argument(
        '--data-file', '-d',
        type=str,
        default=None,
        help='Path to CSV file with training data (if not provided, uses synthetic data)'
    )
    
    args = parser.parse_args()
    
    # Set output dir relative to script location
    output_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        args.output
    )
    
    # Default samples if not specified
    n_samples = args.samples
    if n_samples is None and args.data_file is None:
        n_samples = 1000  # Default for synthetic
    
    train_models(output_dir, args.model_type, n_samples, args.data_file)


if __name__ == '__main__':
    main()
