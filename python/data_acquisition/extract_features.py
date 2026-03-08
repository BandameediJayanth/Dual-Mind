"""
Feature Extraction Script - Convert public datasets to FeatureProcessor format

Extracts features from:
- UCI Connect-4 dataset -> FourInARow game features
- UCI Tic-Tac-Toe dataset -> TicTacToe game features  
- Generates synthetic features for Memory Match and Word Chain

Output: CSV files compatible with train_models.py
"""

import csv
import os
import random
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any
import hashlib

# Add parent for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


def parse_connect4_data(data_file: str) -> List[Dict]:
    """
    Parse UCI Connect-4 dataset and extract game features.
    
    The dataset contains board positions (42 cells) + outcome (win/loss/draw).
    We derive cognitive features from board analysis.
    """
    print(f"  Parsing Connect-4 data from {data_file}")
    
    samples = []
    
    with open(data_file, 'r') as f:
        reader = csv.reader(f)
        for row_idx, row in enumerate(reader):
            if len(row) < 43:
                continue
                
            # Board is 42 cells (6 rows x 7 cols), last column is outcome
            board = row[:42]
            outcome = row[42].strip()
            
            # Count pieces
            x_count = sum(1 for c in board if c == 'x')
            o_count = sum(1 for c in board if c == 'o')
            b_count = sum(1 for c in board if c == 'b')
            total_moves = x_count + o_count
            
            # Derive features (simulated based on board state complexity)
            # These map to FeatureProcessor expected features
            
            # Strategic depth: more filled board = deeper game
            strategic_depth = min(1.0, total_moves / 30)
            
            # Move accuracy: winning positions have higher accuracy
            if outcome == 'win':
                base_accuracy = random.gauss(0.75, 0.1)
            elif outcome == 'draw':
                base_accuracy = random.gauss(0.6, 0.1)
            else:
                base_accuracy = random.gauss(0.45, 0.1)
            move_accuracy = max(0, min(1, base_accuracy))
            
            # Pattern recognition (based on position complexity)
            pattern_success_rate = max(0, min(1, random.gauss(0.5 + strategic_depth * 0.3, 0.15)))
            
            # Decision time (simulated - deeper games take longer)
            avg_decision_time = 2000 + strategic_depth * 4000 + random.gauss(0, 500)
            avg_decision_time = max(1000, min(8000, avg_decision_time))
            
            # Consistency (winners are more consistent)
            if outcome == 'win':
                consistency = random.gauss(0.7, 0.12)
            else:
                consistency = random.gauss(0.5, 0.15)
            consistency_score = max(0, min(1, consistency))
            
            # Error rate (inverse of accuracy with noise)
            error_rate = max(0, min(1, 1 - move_accuracy + random.gauss(0, 0.05)))
            
            # Optimal play rate (correlated with outcome)
            if outcome == 'win':
                optimal_play_rate = random.gauss(0.35, 0.12)
            elif outcome == 'draw':
                optimal_play_rate = random.gauss(0.25, 0.1)
            else:
                optimal_play_rate = random.gauss(0.15, 0.08)
            optimal_play_rate = max(0, min(1, optimal_play_rate))
            
            # Strategic move rate
            strategic_move_rate = max(0, min(1, optimal_play_rate + random.gauss(0.05, 0.05)))
            
            # Logical reasoning (derived from strategic depth and accuracy)
            logical_reasoning = max(0, min(1, (strategic_depth + move_accuracy) / 2 + random.gauss(0, 0.1)))
            
            # Memory accuracy (less relevant for Connect-4, use moderate values)
            memory_accuracy = random.gauss(0.5, 0.15)
            memory_accuracy = max(0, min(1, memory_accuracy))
            
            # Win rate (based on outcome)
            win_rate = 1.0 if outcome == 'win' else (0.5 if outcome == 'draw' else 0.0)
            
            # Improvement rate (random for single position)
            improvement_rate = random.gauss(0.02, 0.05)
            
            # Decision time variance
            decision_time_variance = random.uniform(100000, 2000000)
            
            # Determine skill tier based on features
            skill_score = (move_accuracy * 0.3 + consistency_score * 0.2 + 
                          strategic_depth * 0.2 + optimal_play_rate * 0.3)
            if skill_score >= 0.7:
                skill_tier = 4  # Expert
            elif skill_score >= 0.55:
                skill_tier = 3  # Advanced
            elif skill_score >= 0.4:
                skill_tier = 2  # Intermediate
            elif skill_score >= 0.25:
                skill_tier = 1  # Beginner
            else:
                skill_tier = 0  # Novice
            
            # Performance score
            performance_score = skill_score * 100
            
            sample = {
                'game': 'connect4',
                'session_id': f"c4_{row_idx}",
                # Core features matching FeatureProcessor
                'avg_decision_time': round(avg_decision_time, 1),
                'decision_time_variance': round(decision_time_variance, 1),
                'move_accuracy': round(move_accuracy, 4),
                'error_rate': round(error_rate, 4),
                'pattern_success_rate': round(pattern_success_rate, 4),
                'consistency_score': round(consistency_score, 4),
                'optimal_play_rate': round(optimal_play_rate, 4),
                'strategic_move_rate': round(strategic_move_rate, 4),
                'strategic_depth': round(strategic_depth, 4),
                'memory_accuracy': round(memory_accuracy, 4),
                'logical_reasoning': round(logical_reasoning, 4),
                'improvement_rate': round(improvement_rate, 4),
                'win_rate': round(win_rate, 4),
                # Labels
                'skill_tier': skill_tier,
                'performance_score': round(performance_score, 2),
                'outcome': outcome
            }
            samples.append(sample)
    
    print(f"  Extracted {len(samples)} samples from Connect-4")
    return samples


def parse_tictactoe_data(data_file: str) -> List[Dict]:
    """
    Parse UCI Tic-Tac-Toe Endgame dataset.
    
    The dataset contains 958 endgame board positions with win/loss labels.
    """
    print(f"  Parsing Tic-Tac-Toe data from {data_file}")
    
    samples = []
    
    with open(data_file, 'r') as f:
        reader = csv.reader(f)
        for row_idx, row in enumerate(reader):
            if len(row) < 10:
                continue
            
            # 9 board positions + class (positive=win, negative=loss)
            board = row[:9]
            outcome = row[9].strip()
            is_win = outcome == 'positive'
            
            # Count pieces
            x_count = sum(1 for c in board if c == 'x')
            o_count = sum(1 for c in board if c == 'o')
            total_moves = x_count + o_count
            
            # Tic-Tac-Toe is simpler, adjust feature distributions
            strategic_depth = total_moves / 9  # Max 9 moves
            
            # Features based on win/loss
            if is_win:
                move_accuracy = random.gauss(0.7, 0.12)
                consistency_score = random.gauss(0.65, 0.15)
                optimal_play_rate = random.gauss(0.45, 0.15)
            else:
                move_accuracy = random.gauss(0.5, 0.15)
                consistency_score = random.gauss(0.45, 0.15)
                optimal_play_rate = random.gauss(0.25, 0.12)
            
            move_accuracy = max(0, min(1, move_accuracy))
            consistency_score = max(0, min(1, consistency_score))
            optimal_play_rate = max(0, min(1, optimal_play_rate))
            
            error_rate = max(0, min(1, 1 - move_accuracy + random.gauss(0, 0.05)))
            pattern_success_rate = max(0, min(1, random.gauss(0.5, 0.2)))
            strategic_move_rate = max(0, min(1, optimal_play_rate + random.gauss(0, 0.05)))
            logical_reasoning = max(0, min(1, move_accuracy * 0.7 + random.gauss(0.2, 0.1)))
            memory_accuracy = random.gauss(0.5, 0.15)
            memory_accuracy = max(0, min(1, memory_accuracy))
            
            # Faster decisions for simpler game
            avg_decision_time = 1500 + random.gauss(0, 500)
            avg_decision_time = max(500, min(5000, avg_decision_time))
            decision_time_variance = random.uniform(50000, 500000)
            
            win_rate = 1.0 if is_win else 0.0
            improvement_rate = random.gauss(0.02, 0.03)
            
            # Skill tier
            skill_score = (move_accuracy * 0.3 + consistency_score * 0.2 + 
                          strategic_depth * 0.15 + optimal_play_rate * 0.35)
            if skill_score >= 0.65:
                skill_tier = 4
            elif skill_score >= 0.5:
                skill_tier = 3
            elif skill_score >= 0.35:
                skill_tier = 2
            elif skill_score >= 0.2:
                skill_tier = 1
            else:
                skill_tier = 0
            
            performance_score = skill_score * 100
            
            sample = {
                'game': 'tictactoe',
                'session_id': f"ttt_{row_idx}",
                'avg_decision_time': round(avg_decision_time, 1),
                'decision_time_variance': round(decision_time_variance, 1),
                'move_accuracy': round(move_accuracy, 4),
                'error_rate': round(error_rate, 4),
                'pattern_success_rate': round(pattern_success_rate, 4),
                'consistency_score': round(consistency_score, 4),
                'optimal_play_rate': round(optimal_play_rate, 4),
                'strategic_move_rate': round(strategic_move_rate, 4),
                'strategic_depth': round(strategic_depth, 4),
                'memory_accuracy': round(memory_accuracy, 4),
                'logical_reasoning': round(logical_reasoning, 4),
                'improvement_rate': round(improvement_rate, 4),
                'win_rate': round(win_rate, 4),
                'skill_tier': skill_tier,
                'performance_score': round(performance_score, 2),
                'outcome': 'win' if is_win else 'loss'
            }
            samples.append(sample)
    
    print(f"  Extracted {len(samples)} samples from Tic-Tac-Toe")
    return samples


def generate_memory_match_samples(n_samples: int = 5000, seed: int = 42) -> List[Dict]:
    """
    Generate synthetic Memory Match game samples.
    
    Memory Match is about remembering card positions - key features:
    - Memory accuracy (primary)
    - Decision time (faster = better memory)
    - Pattern recognition (matching pairs)
    """
    print(f"  Generating {n_samples} synthetic Memory Match samples")
    random.seed(seed)
    
    samples = []
    
    # Skill tier distributions
    tier_configs = {
        0: {'memory_acc': (0.35, 0.1), 'decision_time': (5500, 1000), 'pattern': (0.3, 0.1)},
        1: {'memory_acc': (0.5, 0.1), 'decision_time': (4500, 800), 'pattern': (0.45, 0.1)},
        2: {'memory_acc': (0.65, 0.1), 'decision_time': (3500, 700), 'pattern': (0.6, 0.1)},
        3: {'memory_acc': (0.78, 0.08), 'decision_time': (2500, 500), 'pattern': (0.75, 0.08)},
        4: {'memory_acc': (0.9, 0.05), 'decision_time': (1800, 400), 'pattern': (0.88, 0.06)},
    }
    
    tier_probs = [0.15, 0.25, 0.30, 0.20, 0.10]
    
    for i in range(n_samples):
        tier = random.choices(range(5), weights=tier_probs)[0]
        cfg = tier_configs[tier]
        
        memory_accuracy = max(0, min(1, random.gauss(*cfg['memory_acc'])))
        avg_decision_time = max(800, min(8000, random.gauss(*cfg['decision_time'])))
        pattern_success_rate = max(0, min(1, random.gauss(*cfg['pattern'])))
        
        # Derived features
        move_accuracy = max(0, min(1, memory_accuracy * 0.8 + random.gauss(0.1, 0.05)))
        consistency_score = max(0, min(1, memory_accuracy * 0.7 + random.gauss(0.15, 0.08)))
        error_rate = max(0, min(1, 1 - memory_accuracy + random.gauss(0, 0.05)))
        
        # Memory games don't have strategic depth like board games
        strategic_depth = random.gauss(0.3, 0.1)
        strategic_depth = max(0, min(1, strategic_depth))
        optimal_play_rate = max(0, min(1, memory_accuracy * 0.6 + random.gauss(0, 0.1)))
        strategic_move_rate = optimal_play_rate
        logical_reasoning = max(0, min(1, pattern_success_rate * 0.5 + memory_accuracy * 0.3 + random.gauss(0.1, 0.05)))
        
        decision_time_variance = random.uniform(100000, 1500000)
        improvement_rate = random.gauss(0.03, 0.04)
        win_rate = max(0, min(1, memory_accuracy * 0.8 + random.gauss(0, 0.1)))
        
        performance_score = (memory_accuracy * 40 + pattern_success_rate * 30 + 
                           consistency_score * 20 + (1 - error_rate) * 10)
        
        sample = {
            'game': 'memory_match',
            'session_id': f"mm_{i}",
            'avg_decision_time': round(avg_decision_time, 1),
            'decision_time_variance': round(decision_time_variance, 1),
            'move_accuracy': round(move_accuracy, 4),
            'error_rate': round(error_rate, 4),
            'pattern_success_rate': round(pattern_success_rate, 4),
            'consistency_score': round(consistency_score, 4),
            'optimal_play_rate': round(optimal_play_rate, 4),
            'strategic_move_rate': round(strategic_move_rate, 4),
            'strategic_depth': round(strategic_depth, 4),
            'memory_accuracy': round(memory_accuracy, 4),
            'logical_reasoning': round(logical_reasoning, 4),
            'improvement_rate': round(improvement_rate, 4),
            'win_rate': round(win_rate, 4),
            'skill_tier': tier,
            'performance_score': round(performance_score, 2),
            'outcome': 'win' if win_rate > 0.5 else 'loss'
        }
        samples.append(sample)
    
    print(f"  Generated {len(samples)} Memory Match samples")
    return samples


def generate_word_chain_samples(word_file: str, n_samples: int = 5000, seed: int = 42) -> List[Dict]:
    """
    Generate synthetic Word Chain samples using real vocabulary.
    
    Word Chain tests vocabulary and quick thinking - key features:
    - Decision time (speed of word recall)
    - Vocabulary score (word complexity/rarity)
    - Logical reasoning (valid chain connections)
    """
    print(f"  Generating {n_samples} Word Chain samples using {word_file}")
    random.seed(seed)
    
    # Load words if available
    words = []
    if os.path.exists(word_file):
        with open(word_file, 'r', encoding='utf-8', errors='ignore') as f:
            words = [line.strip().lower() for line in f if len(line.strip()) >= 3]
        print(f"    Loaded {len(words)} words")
    
    samples = []
    
    tier_configs = {
        0: {'vocab': (0.3, 0.1), 'decision_time': (6000, 1200), 'logical': (0.35, 0.12)},
        1: {'vocab': (0.45, 0.1), 'decision_time': (4800, 1000), 'logical': (0.48, 0.1)},
        2: {'vocab': (0.6, 0.1), 'decision_time': (3500, 800), 'logical': (0.62, 0.1)},
        3: {'vocab': (0.75, 0.08), 'decision_time': (2500, 600), 'logical': (0.76, 0.08)},
        4: {'vocab': (0.88, 0.05), 'decision_time': (1800, 400), 'logical': (0.88, 0.05)},
    }
    
    tier_probs = [0.15, 0.25, 0.30, 0.20, 0.10]
    
    for i in range(n_samples):
        tier = random.choices(range(5), weights=tier_probs)[0]
        cfg = tier_configs[tier]
        
        vocabulary_score = max(0, min(1, random.gauss(*cfg['vocab'])))
        avg_decision_time = max(1000, min(10000, random.gauss(*cfg['decision_time'])))
        logical_reasoning = max(0, min(1, random.gauss(*cfg['logical'])))
        
        # Derived features
        move_accuracy = max(0, min(1, vocabulary_score * 0.6 + logical_reasoning * 0.3 + random.gauss(0.05, 0.05)))
        consistency_score = max(0, min(1, vocabulary_score * 0.5 + random.gauss(0.3, 0.1)))
        error_rate = max(0, min(1, 1 - move_accuracy + random.gauss(0, 0.08)))
        pattern_success_rate = max(0, min(1, logical_reasoning * 0.7 + random.gauss(0.15, 0.1)))
        
        strategic_depth = random.gauss(0.4, 0.15)
        strategic_depth = max(0, min(1, strategic_depth))
        optimal_play_rate = max(0, min(1, vocabulary_score * 0.5 + random.gauss(0.1, 0.1)))
        strategic_move_rate = optimal_play_rate
        memory_accuracy = max(0, min(1, vocabulary_score * 0.4 + random.gauss(0.3, 0.1)))
        
        decision_time_variance = random.uniform(200000, 2500000)
        improvement_rate = random.gauss(0.02, 0.04)
        win_rate = max(0, min(1, vocabulary_score * 0.7 + logical_reasoning * 0.2 + random.gauss(0, 0.1)))
        
        performance_score = (vocabulary_score * 35 + logical_reasoning * 30 + 
                           move_accuracy * 20 + consistency_score * 15)
        
        sample = {
            'game': 'word_chain',
            'session_id': f"wc_{i}",
            'avg_decision_time': round(avg_decision_time, 1),
            'decision_time_variance': round(decision_time_variance, 1),
            'move_accuracy': round(move_accuracy, 4),
            'error_rate': round(error_rate, 4),
            'pattern_success_rate': round(pattern_success_rate, 4),
            'consistency_score': round(consistency_score, 4),
            'optimal_play_rate': round(optimal_play_rate, 4),
            'strategic_move_rate': round(strategic_move_rate, 4),
            'strategic_depth': round(strategic_depth, 4),
            'memory_accuracy': round(memory_accuracy, 4),
            'logical_reasoning': round(logical_reasoning, 4),
            'improvement_rate': round(improvement_rate, 4),
            'win_rate': round(win_rate, 4),
            'skill_tier': tier,
            'performance_score': round(performance_score, 2),
            'outcome': 'win' if win_rate > 0.5 else 'loss'
        }
        samples.append(sample)
    
    print(f"  Generated {len(samples)} Word Chain samples")
    return samples


def generate_checkers_samples(n_samples: int = 5000, seed: int = 42) -> List[Dict]:
    """
    Generate synthetic Checkers game samples.
    
    Checkers tests strategic thinking and planning - key features:
    - Strategic depth (planning moves ahead)
    - Move accuracy (capturing opportunities)
    - Logical reasoning (piece positioning)
    """
    print(f"  Generating {n_samples} synthetic Checkers samples")
    random.seed(seed)
    
    samples = []
    
    tier_configs = {
        0: {'strategy': (0.25, 0.1), 'accuracy': (0.35, 0.12), 'decision_time': (5500, 1200)},
        1: {'strategy': (0.4, 0.1), 'accuracy': (0.48, 0.1), 'decision_time': (4500, 1000)},
        2: {'strategy': (0.55, 0.1), 'accuracy': (0.62, 0.1), 'decision_time': (3500, 800)},
        3: {'strategy': (0.72, 0.08), 'accuracy': (0.76, 0.08), 'decision_time': (2800, 600)},
        4: {'strategy': (0.87, 0.05), 'accuracy': (0.88, 0.05), 'decision_time': (2000, 400)},
    }
    
    tier_probs = [0.15, 0.25, 0.30, 0.20, 0.10]
    
    for i in range(n_samples):
        tier = random.choices(range(5), weights=tier_probs)[0]
        cfg = tier_configs[tier]
        
        strategic_depth = max(0, min(1, random.gauss(*cfg['strategy'])))
        move_accuracy = max(0, min(1, random.gauss(*cfg['accuracy'])))
        avg_decision_time = max(1000, min(8000, random.gauss(*cfg['decision_time'])))
        
        # Derived features
        error_rate = max(0, min(1, 1 - move_accuracy + random.gauss(0, 0.05)))
        consistency_score = max(0, min(1, move_accuracy * 0.6 + strategic_depth * 0.3 + random.gauss(0.05, 0.08)))
        pattern_success_rate = max(0, min(1, strategic_depth * 0.7 + random.gauss(0.15, 0.1)))
        optimal_play_rate = max(0, min(1, move_accuracy * 0.5 + strategic_depth * 0.4 + random.gauss(0, 0.08)))
        strategic_move_rate = max(0, min(1, optimal_play_rate + random.gauss(0, 0.05)))
        logical_reasoning = max(0, min(1, strategic_depth * 0.6 + move_accuracy * 0.3 + random.gauss(0.05, 0.08)))
        memory_accuracy = max(0, min(1, random.gauss(0.5, 0.15)))
        
        decision_time_variance = random.uniform(150000, 2000000)
        improvement_rate = random.gauss(0.02, 0.04)
        win_rate = max(0, min(1, strategic_depth * 0.4 + move_accuracy * 0.4 + random.gauss(0.1, 0.1)))
        
        performance_score = (strategic_depth * 35 + move_accuracy * 30 + 
                           consistency_score * 20 + optimal_play_rate * 15)
        
        sample = {
            'game': 'checkers',
            'session_id': f"ck_{i}",
            'avg_decision_time': round(avg_decision_time, 1),
            'decision_time_variance': round(decision_time_variance, 1),
            'move_accuracy': round(move_accuracy, 4),
            'error_rate': round(error_rate, 4),
            'pattern_success_rate': round(pattern_success_rate, 4),
            'consistency_score': round(consistency_score, 4),
            'optimal_play_rate': round(optimal_play_rate, 4),
            'strategic_move_rate': round(strategic_move_rate, 4),
            'strategic_depth': round(strategic_depth, 4),
            'memory_accuracy': round(memory_accuracy, 4),
            'logical_reasoning': round(logical_reasoning, 4),
            'improvement_rate': round(improvement_rate, 4),
            'win_rate': round(win_rate, 4),
            'skill_tier': tier,
            'performance_score': round(performance_score, 2),
            'outcome': 'win' if win_rate > 0.5 else 'loss'
        }
        samples.append(sample)
    
    print(f"  Generated {len(samples)} Checkers samples")
    return samples


def generate_colorwars_samples(n_samples: int = 5000, seed: int = 42) -> List[Dict]:
    """
    Generate synthetic ColorWars game samples.
    
    ColorWars tests pattern recognition and spatial reasoning.
    """
    print(f"  Generating {n_samples} synthetic ColorWars samples")
    random.seed(seed)
    
    samples = []
    
    tier_configs = {
        0: {'pattern': (0.3, 0.12), 'accuracy': (0.35, 0.12), 'decision_time': (4500, 1000)},
        1: {'pattern': (0.45, 0.1), 'accuracy': (0.5, 0.1), 'decision_time': (3800, 800)},
        2: {'pattern': (0.6, 0.1), 'accuracy': (0.65, 0.1), 'decision_time': (3000, 700)},
        3: {'pattern': (0.75, 0.08), 'accuracy': (0.78, 0.08), 'decision_time': (2300, 500)},
        4: {'pattern': (0.88, 0.05), 'accuracy': (0.9, 0.05), 'decision_time': (1700, 350)},
    }
    
    tier_probs = [0.15, 0.25, 0.30, 0.20, 0.10]
    
    for i in range(n_samples):
        tier = random.choices(range(5), weights=tier_probs)[0]
        cfg = tier_configs[tier]
        
        pattern_success_rate = max(0, min(1, random.gauss(*cfg['pattern'])))
        move_accuracy = max(0, min(1, random.gauss(*cfg['accuracy'])))
        avg_decision_time = max(800, min(7000, random.gauss(*cfg['decision_time'])))
        
        error_rate = max(0, min(1, 1 - move_accuracy + random.gauss(0, 0.05)))
        consistency_score = max(0, min(1, move_accuracy * 0.5 + pattern_success_rate * 0.4 + random.gauss(0.05, 0.08)))
        strategic_depth = max(0, min(1, pattern_success_rate * 0.6 + random.gauss(0.2, 0.1)))
        optimal_play_rate = max(0, min(1, move_accuracy * 0.6 + random.gauss(0.1, 0.1)))
        strategic_move_rate = optimal_play_rate
        logical_reasoning = max(0, min(1, pattern_success_rate * 0.7 + random.gauss(0.15, 0.08)))
        memory_accuracy = max(0, min(1, pattern_success_rate * 0.5 + random.gauss(0.25, 0.1)))
        
        decision_time_variance = random.uniform(80000, 1200000)
        improvement_rate = random.gauss(0.025, 0.04)
        win_rate = max(0, min(1, pattern_success_rate * 0.5 + move_accuracy * 0.4 + random.gauss(0, 0.1)))
        
        performance_score = (pattern_success_rate * 35 + move_accuracy * 30 + 
                           consistency_score * 20 + strategic_depth * 15)
        
        sample = {
            'game': 'color_wars',
            'session_id': f"cw_{i}",
            'avg_decision_time': round(avg_decision_time, 1),
            'decision_time_variance': round(decision_time_variance, 1),
            'move_accuracy': round(move_accuracy, 4),
            'error_rate': round(error_rate, 4),
            'pattern_success_rate': round(pattern_success_rate, 4),
            'consistency_score': round(consistency_score, 4),
            'optimal_play_rate': round(optimal_play_rate, 4),
            'strategic_move_rate': round(strategic_move_rate, 4),
            'strategic_depth': round(strategic_depth, 4),
            'memory_accuracy': round(memory_accuracy, 4),
            'logical_reasoning': round(logical_reasoning, 4),
            'improvement_rate': round(improvement_rate, 4),
            'win_rate': round(win_rate, 4),
            'skill_tier': tier,
            'performance_score': round(performance_score, 2),
            'outcome': 'win' if win_rate > 0.5 else 'loss'
        }
        samples.append(sample)
    
    print(f"  Generated {len(samples)} ColorWars samples")
    return samples


def write_samples_to_csv(samples: List[Dict], output_file: str):
    """Write samples to CSV file."""
    if not samples:
        return
    
    fieldnames = list(samples[0].keys())
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(samples)
    
    print(f"  Wrote {len(samples)} samples to {output_file}")


def extract_all_features(datasets_dir: str = 'datasets', output_dir: str = 'training_data'):
    """
    Extract features from all downloaded datasets and generate synthetic samples.
    """
    base_dir = Path(__file__).parent
    datasets_path = base_dir / datasets_dir
    output_path = base_dir / output_dir
    output_path.mkdir(parents=True, exist_ok=True)
    
    print("\n" + "=" * 60)
    print("Feature Extraction for Game Suite ML Training")
    print("=" * 60)
    
    all_samples = []
    
    # 1. Connect-4 (UCI)
    c4_file = datasets_path / 'connect4_uci' / 'connect-4.data'
    if c4_file.exists():
        c4_samples = parse_connect4_data(str(c4_file))
        all_samples.extend(c4_samples)
        write_samples_to_csv(c4_samples, str(output_path / 'connect4_features.csv'))
    else:
        print(f"  Warning: Connect-4 data not found at {c4_file}")
    
    # 2. Tic-Tac-Toe (UCI)
    ttt_file = datasets_path / 'tictactoe_uci' / 'tic-tac-toe.data'
    if ttt_file.exists():
        ttt_samples = parse_tictactoe_data(str(ttt_file))
        all_samples.extend(ttt_samples)
        write_samples_to_csv(ttt_samples, str(output_path / 'tictactoe_features.csv'))
    else:
        print(f"  Warning: Tic-Tac-Toe data not found at {ttt_file}")
    
    # 3. Memory Match (synthetic)
    mm_samples = generate_memory_match_samples(n_samples=5000)
    all_samples.extend(mm_samples)
    write_samples_to_csv(mm_samples, str(output_path / 'memory_match_features.csv'))
    
    # 4. Word Chain (synthetic with real vocabulary)
    word_file = datasets_path / 'english_words' / 'words_alpha.txt'
    wc_samples = generate_word_chain_samples(str(word_file), n_samples=5000)
    all_samples.extend(wc_samples)
    write_samples_to_csv(wc_samples, str(output_path / 'word_chain_features.csv'))
    
    # 5. Checkers (synthetic)
    ck_samples = generate_checkers_samples(n_samples=5000)
    all_samples.extend(ck_samples)
    write_samples_to_csv(ck_samples, str(output_path / 'checkers_features.csv'))
    
    # 6. ColorWars (synthetic)
    cw_samples = generate_colorwars_samples(n_samples=5000)
    all_samples.extend(cw_samples)
    write_samples_to_csv(cw_samples, str(output_path / 'colorwars_features.csv'))
    
    # Combined dataset
    write_samples_to_csv(all_samples, str(output_path / 'all_games_combined.csv'))
    
    # Summary
    print("\n" + "=" * 60)
    print("Extraction Summary")
    print("=" * 60)
    
    # Count by game
    game_counts = {}
    tier_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}
    for s in all_samples:
        game = s['game']
        game_counts[game] = game_counts.get(game, 0) + 1
        tier_counts[s['skill_tier']] += 1
    
    print("\nSamples by game:")
    for game, count in sorted(game_counts.items()):
        print(f"  {game}: {count:,}")
    
    print("\nSamples by skill tier:")
    tier_names = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert']
    for tier, count in tier_counts.items():
        print(f"  {tier_names[tier]}: {count:,}")
    
    print(f"\nTotal samples: {len(all_samples):,}")
    print(f"Output directory: {output_path.absolute()}")
    
    return all_samples


if __name__ == '__main__':
    extract_all_features()
