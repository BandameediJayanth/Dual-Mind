"""
Trend Analyzer - Analyzes player performance trends over time
"""

import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import json


class TrendAnalyzer:
    """
    Analyzes player performance trends over multiple sessions.
    Detects improvement, decline, and performance patterns.
    """
    
    def __init__(self):
        """Initialize the trend analyzer."""
        self.min_sessions_for_trend = 3
        self.smoothing_window = 3
    
    def analyze(self, sessions: List[Dict]) -> Dict[str, Any]:
        """
        Analyze performance trends from session history.
        
        Args:
            sessions: List of session data with timestamps and performance metrics
            
        Returns:
            Trend analysis results
        """
        if not sessions:
            return self._empty_analysis()
        
        # Sort sessions by timestamp
        sorted_sessions = sorted(
            sessions, 
            key=lambda s: s.get('timestamp', 0)
        )
        
        # Extract performance metrics
        performance_scores = [
            s.get('performance_index', s.get('score', 50)) 
            for s in sorted_sessions
        ]
        
        timestamps = [
            s.get('timestamp', i) 
            for i, s in enumerate(sorted_sessions)
        ]
        
        # Calculate trends
        overall_trend = self._calculate_trend(performance_scores)
        short_term_trend = self._calculate_trend(performance_scores[-5:]) if len(performance_scores) >= 3 else 0
        
        # Detect patterns
        patterns = self._detect_patterns(performance_scores, timestamps)
        
        # Calculate statistics
        stats = self._calculate_statistics(performance_scores)
        
        # Skill progression
        skill_progression = self._analyze_skill_progression(sorted_sessions)
        
        # Improvement rate
        improvement_rate = self._calculate_improvement_rate(performance_scores, timestamps)
        
        # Predict future performance
        prediction = self._predict_future(performance_scores)
        
        return {
            'overall_trend': overall_trend,
            'short_term_trend': short_term_trend,
            'trend_direction': self._classify_trend(overall_trend),
            'statistics': stats,
            'patterns': patterns,
            'skill_progression': skill_progression,
            'improvement_rate': improvement_rate,
            'prediction': prediction,
            'sessions_analyzed': len(sessions),
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def _empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis for no data."""
        return {
            'overall_trend': 0,
            'short_term_trend': 0,
            'trend_direction': 'insufficient_data',
            'statistics': {},
            'patterns': [],
            'skill_progression': {},
            'improvement_rate': 0,
            'prediction': None,
            'sessions_analyzed': 0,
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def _calculate_trend(self, values: List[float]) -> float:
        """
        Calculate trend using linear regression slope.
        
        Returns:
            Slope normalized to -1 to 1 range
        """
        if len(values) < 2:
            return 0.0
            
        n = len(values)
        x = np.arange(n)
        y = np.array(values)
        
        # Linear regression
        x_mean = np.mean(x)
        y_mean = np.mean(y)
        
        numerator = np.sum((x - x_mean) * (y - y_mean))
        denominator = np.sum((x - x_mean) ** 2)
        
        if denominator == 0:
            return 0.0
            
        slope = numerator / denominator
        
        # Normalize slope (assuming performance is 0-100)
        # A slope of 10 points per session is very high
        normalized_slope = np.tanh(slope / 10)
        
        return float(normalized_slope)
    
    def _classify_trend(self, trend: float) -> str:
        """Classify trend value into categories."""
        if trend > 0.3:
            return 'strong_improvement'
        elif trend > 0.1:
            return 'improvement'
        elif trend > -0.1:
            return 'stable'
        elif trend > -0.3:
            return 'decline'
        else:
            return 'strong_decline'
    
    def _calculate_statistics(self, scores: List[float]) -> Dict[str, float]:
        """Calculate statistical summary of performance."""
        if not scores:
            return {}
            
        arr = np.array(scores)
        
        return {
            'mean': float(np.mean(arr)),
            'median': float(np.median(arr)),
            'std': float(np.std(arr)),
            'min': float(np.min(arr)),
            'max': float(np.max(arr)),
            'range': float(np.max(arr) - np.min(arr)),
            'latest': float(scores[-1]),
            'best': float(np.max(arr)),
            'percentile_25': float(np.percentile(arr, 25)),
            'percentile_75': float(np.percentile(arr, 75))
        }
    
    def _detect_patterns(self, scores: List[float], 
                         timestamps: List[Any]) -> List[Dict[str, Any]]:
        """Detect performance patterns."""
        patterns = []
        
        if len(scores) < 5:
            return patterns
        
        arr = np.array(scores)
        
        # Detect streaks
        improving_streak = self._find_streak(scores, 'improving')
        if improving_streak >= 3:
            patterns.append({
                'type': 'improving_streak',
                'length': improving_streak,
                'description': f'{improving_streak} consecutive improvements'
            })
        
        declining_streak = self._find_streak(scores, 'declining')
        if declining_streak >= 3:
            patterns.append({
                'type': 'declining_streak',
                'length': declining_streak,
                'description': f'{declining_streak} consecutive declines'
            })
        
        # Detect volatility
        if np.std(arr) > 15:
            patterns.append({
                'type': 'high_volatility',
                'std': float(np.std(arr)),
                'description': 'Inconsistent performance'
            })
        elif np.std(arr) < 5:
            patterns.append({
                'type': 'consistent',
                'std': float(np.std(arr)),
                'description': 'Very consistent performance'
            })
        
        # Detect plateau
        recent = arr[-5:] if len(arr) >= 5 else arr
        if np.std(recent) < 3 and len(recent) >= 3:
            patterns.append({
                'type': 'plateau',
                'level': float(np.mean(recent)),
                'description': 'Performance has plateaued'
            })
        
        # Detect breakthrough
        if len(arr) >= 5:
            recent_mean = np.mean(arr[-3:])
            earlier_mean = np.mean(arr[:-3])
            if recent_mean > earlier_mean + 15:
                patterns.append({
                    'type': 'breakthrough',
                    'improvement': float(recent_mean - earlier_mean),
                    'description': 'Significant recent improvement'
                })
        
        return patterns
    
    def _find_streak(self, scores: List[float], streak_type: str) -> int:
        """Find the current streak length."""
        if len(scores) < 2:
            return 0
            
        streak = 0
        for i in range(len(scores) - 1, 0, -1):
            diff = scores[i] - scores[i - 1]
            
            if streak_type == 'improving' and diff > 0:
                streak += 1
            elif streak_type == 'declining' and diff < 0:
                streak += 1
            else:
                break
                
        return streak
    
    def _analyze_skill_progression(self, sessions: List[Dict]) -> Dict[str, Any]:
        """Analyze skill tier progression over time."""
        tier_order = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert']
        
        tiers = [s.get('skill_tier', 'Beginner') for s in sessions]
        tier_indices = [tier_order.index(t) if t in tier_order else 1 for t in tiers]
        
        if not tier_indices:
            return {}
        
        current_tier = tiers[-1] if tiers else 'Unknown'
        highest_tier = tier_order[max(tier_indices)]
        
        # Find tier changes
        tier_changes = []
        for i in range(1, len(tier_indices)):
            if tier_indices[i] != tier_indices[i-1]:
                tier_changes.append({
                    'from': tier_order[tier_indices[i-1]],
                    'to': tier_order[tier_indices[i]],
                    'session': i
                })
        
        return {
            'current_tier': current_tier,
            'highest_tier': highest_tier,
            'tier_changes': tier_changes,
            'sessions_at_current': self._count_streak_at_tier(tiers, current_tier),
            'progress_to_next': self._calculate_tier_progress(sessions)
        }
    
    def _count_streak_at_tier(self, tiers: List[str], current_tier: str) -> int:
        """Count consecutive sessions at current tier."""
        count = 0
        for tier in reversed(tiers):
            if tier == current_tier:
                count += 1
            else:
                break
        return count
    
    def _calculate_tier_progress(self, sessions: List[Dict]) -> float:
        """Estimate progress toward next tier."""
        if not sessions:
            return 0.0
            
        # Use recent performance trend
        recent_scores = [s.get('performance_index', 50) for s in sessions[-5:]]
        if not recent_scores:
            return 0.0
            
        avg_score = np.mean(recent_scores)
        
        # Tier thresholds
        thresholds = [0, 35, 55, 75, 90, 100]
        
        for i, threshold in enumerate(thresholds[:-1]):
            if avg_score < thresholds[i + 1]:
                # Progress within this tier
                tier_range = thresholds[i + 1] - threshold
                progress = (avg_score - threshold) / tier_range
                return float(max(0, min(1, progress)))
        
        return 1.0  # Already at highest tier
    
    def _calculate_improvement_rate(self, scores: List[float], 
                                     timestamps: List[Any]) -> float:
        """Calculate improvement rate (points per session)."""
        if len(scores) < 2:
            return 0.0
            
        # Simple linear improvement rate
        total_change = scores[-1] - scores[0]
        n_sessions = len(scores)
        
        return float(total_change / max(n_sessions - 1, 1))
    
    def _predict_future(self, scores: List[float], 
                        sessions_ahead: int = 5) -> Optional[Dict[str, Any]]:
        """Predict future performance using trend extrapolation."""
        if len(scores) < self.min_sessions_for_trend:
            return None
        
        # Use exponential moving average for smoothing
        alpha = 0.3
        smoothed = [scores[0]]
        for score in scores[1:]:
            smoothed.append(alpha * score + (1 - alpha) * smoothed[-1])
        
        # Calculate recent trend
        if len(smoothed) >= 3:
            recent_trend = (smoothed[-1] - smoothed[-3]) / 2
        else:
            recent_trend = 0
        
        # Dampen trend for prediction
        dampening = 0.8
        predictions = []
        current = smoothed[-1]
        
        for i in range(sessions_ahead):
            next_val = current + recent_trend * (dampening ** i)
            next_val = max(0, min(100, next_val))  # Clamp to valid range
            predictions.append(round(next_val, 1))
            current = next_val
        
        return {
            'predicted_scores': predictions,
            'confidence': 'medium' if len(scores) >= 10 else 'low',
            'trend_assumption': 'recent_trend',
            'sessions_ahead': sessions_ahead
        }
    
    def compare_periods(self, sessions: List[Dict], 
                        period1_sessions: int = 5,
                        period2_sessions: int = 5) -> Dict[str, Any]:
        """Compare performance between two periods."""
        if len(sessions) < period1_sessions + period2_sessions:
            return {'error': 'Insufficient sessions for comparison'}
        
        period1 = sessions[-(period1_sessions + period2_sessions):-period2_sessions]
        period2 = sessions[-period2_sessions:]
        
        p1_scores = [s.get('performance_index', 50) for s in period1]
        p2_scores = [s.get('performance_index', 50) for s in period2]
        
        p1_mean = np.mean(p1_scores)
        p2_mean = np.mean(p2_scores)
        
        return {
            'period1': {
                'mean': float(p1_mean),
                'std': float(np.std(p1_scores)),
                'sessions': period1_sessions
            },
            'period2': {
                'mean': float(p2_mean),
                'std': float(np.std(p2_scores)),
                'sessions': period2_sessions
            },
            'change': float(p2_mean - p1_mean),
            'percent_change': float((p2_mean - p1_mean) / max(p1_mean, 1) * 100),
            'improved': p2_mean > p1_mean
        }
