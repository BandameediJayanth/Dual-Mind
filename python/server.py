"""
DualMind ML API Server — FastAPI + Uvicorn
Scalable backend for 10K concurrent users.

Architecture:
  - FastAPI (async endpoints, auto-docs, Pydantic validation)
  - Uvicorn (ASGI server, multi-worker)
  - LRU Cache (in-memory, 60s TTL for predictions)
  - Redis (optional, for distributed caching if available)
  - Model Singleton (load once, share across requests)
  - Rate Limiting (100 req/min per IP)

Run:
  Development:    uvicorn server:app --reload --port 8000
  Production:     uvicorn server:app --workers 4 --port 8000
"""

import os
import sys
import time
import hashlib
import json
import traceback
from datetime import datetime
from functools import lru_cache
from typing import Dict, List, Optional, Any
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml.skill_predictor import SkillPredictor
from ml.performance_estimator import PerformanceEstimator
from ml.trend_analyzer import TrendAnalyzer

# ═══════════════════════════════════════════════════
# Pydantic Models (automatic request validation)
# ═══════════════════════════════════════════════════

class FeatureInput(BaseModel):
    """Gameplay feature vector sent by the frontend."""
    avg_decision_time: float = Field(default=3000, description="Average decision time in ms")
    move_accuracy: float = Field(default=0.5, ge=0, le=1)
    error_rate: float = Field(default=0.2, ge=0, le=1)
    pattern_success_rate: float = Field(default=0.5, ge=0, le=1)
    consistency_score: float = Field(default=0.5, ge=0, le=1)
    optimal_play_rate: float = Field(default=0.3, ge=0, le=1)
    decision_time_variance: float = Field(default=0)
    strategic_move_rate: float = Field(default=0)
    improvement_rate: float = Field(default=0)
    total_moves: int = Field(default=0)
    session_duration: float = Field(default=0)
    game_id: Optional[str] = None

    class Config:
        extra = "allow"  # Accept game-specific features

class SkillPredictRequest(BaseModel):
    features: Dict[str, Any]

class PerformancePredictRequest(BaseModel):
    features: Dict[str, Any]

class TrendAnalysisRequest(BaseModel):
    sessions: List[Dict[str, Any]]

class BatchPredictRequest(BaseModel):
    features_list: List[Dict[str, Any]]
    prediction_type: str = "skill"

# ═══════════════════════════════════════════════════
# In-Memory Cache (LRU + TTL)
# ═══════════════════════════════════════════════════

class TTLCache:
    """
    Thread-safe in-memory cache with Time-To-Live.
    
    This is the Cache-Aside pattern:
    1. Check cache first
    2. On MISS → compute result → store in cache
    3. On HIT → return cached result (<1ms)
    """
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 60):
        self.max_size = max_size
        self.ttl = ttl_seconds
        self._cache: Dict[str, dict] = {}
    
    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry and (time.time() - entry['ts']) < self.ttl:
            return entry['data']
        if entry:
            del self._cache[key]  # Expired
        return None
    
    def set(self, key: str, data: Any):
        # Evict oldest entries if full
        if len(self._cache) >= self.max_size:
            oldest = sorted(self._cache.items(), key=lambda x: x[1]['ts'])[:100]
            for k, _ in oldest:
                del self._cache[k]
        self._cache[key] = {'data': data, 'ts': time.time()}
    
    def clear(self):
        self._cache.clear()
    
    @property
    def size(self):
        return len(self._cache)

def hash_features(features: dict) -> str:
    """Create a deterministic hash of a feature dict for cache keys."""
    s = json.dumps(features, sort_keys=True, default=str)
    return hashlib.md5(s.encode()).hexdigest()

import re

def camel_to_snake(name: str) -> str:
    """Convert camelCase to snake_case (e.g. avgDecisionTime -> avg_decision_time)."""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def normalize_feature_keys(features: dict) -> dict:
    """Convert all camelCase feature keys to snake_case for the Python models."""
    return {camel_to_snake(k): v for k, v in features.items()}

# ═══════════════════════════════════════════════════
# Rate Limiter (Token Bucket)
# ═══════════════════════════════════════════════════

class RateLimiter:
    """
    Simple in-memory rate limiter.
    Limits requests per IP to prevent abuse.
    
    Token Bucket algorithm:
    - Each IP gets 100 tokens per minute
    - Each request consumes 1 token
    - Tokens refill at a steady rate
    """
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self._buckets: Dict[str, dict] = defaultdict(
            lambda: {'count': 0, 'window_start': time.time()}
        )
    
    def is_allowed(self, ip: str) -> bool:
        bucket = self._buckets[ip]
        now = time.time()
        
        # Reset window if expired
        if (now - bucket['window_start']) > self.window:
            bucket['count'] = 0
            bucket['window_start'] = now
        
        if bucket['count'] >= self.max_requests:
            return False
        
        bucket['count'] += 1
        return True
    
    def get_remaining(self, ip: str) -> int:
        bucket = self._buckets[ip]
        return max(0, self.max_requests - bucket['count'])

# ═══════════════════════════════════════════════════
# Model Singleton (load once, reuse forever)
# ═══════════════════════════════════════════════════

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

class ModelPool:
    """
    Singleton Pattern — load trained models once at startup,
    share across all request handlers.
    
    Why: Loading .pkl files takes ~500ms. With 10K users,
    we load once → serve millions of predictions.
    """
    def __init__(self):
        self.skill_predictor: Optional[SkillPredictor] = None
        self.performance_estimator: Optional[PerformanceEstimator] = None
        self.trend_analyzer = TrendAnalyzer()
        self.load_time = None
        self.prediction_count = 0
    
    def load(self):
        """Load all trained models from disk."""
        start = time.time()
        
        # Skill Predictor
        skill_path = os.path.join(MODEL_DIR, 'skill_predictor')
        if os.path.exists(skill_path + '.pkl'):
            self.skill_predictor = SkillPredictor()
            self.skill_predictor.load(skill_path)
            print(f"  ✓ Skill predictor loaded")
        else:
            print(f"  ⚠ Skill predictor not found at {skill_path}.pkl")
        
        # Performance Estimator
        perf_path = os.path.join(MODEL_DIR, 'performance_estimator')
        if os.path.exists(perf_path + '.pkl'):
            self.performance_estimator = PerformanceEstimator()
            self.performance_estimator.load(perf_path)
            print(f"  ✓ Performance estimator loaded")
        else:
            print(f"  ⚠ Performance estimator not found at {perf_path}.pkl")
        
        self.load_time = time.time() - start
        print(f"  ✓ Models loaded in {self.load_time:.2f}s")
    
    @property
    def status(self) -> dict:
        return {
            'skill_predictor': self.skill_predictor is not None and self.skill_predictor.is_trained,
            'performance_estimator': self.performance_estimator is not None and self.performance_estimator.is_trained,
            'trend_analyzer': True,
            'total_predictions': self.prediction_count,
            'load_time_ms': round((self.load_time or 0) * 1000)
        }

# ═══════════════════════════════════════════════════
# Global Instances
# ═══════════════════════════════════════════════════

models = ModelPool()
cache = TTLCache(max_size=2000, ttl_seconds=60)
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)

# ═══════════════════════════════════════════════════
# FastAPI Application
# ═══════════════════════════════════════════════════

app = FastAPI(
    title="DualMind ML API",
    description="Cognitive game analytics — skill prediction, performance estimation, trend analysis",
    version="2.0.0",
    docs_url="/docs",          # Auto-generated Swagger UI
    redoc_url="/redoc",        # Alternative docs
)

# --- Middleware ---

# CORS: allow frontend to call the API from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Response-Time", "X-RateLimit-Remaining"],
)

# Gzip: compress responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    
    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "detail": f"Max {rate_limiter.max_requests} requests per minute",
                "retry_after": rate_limiter.window
            }
        )
    
    response = await call_next(request)
    response.headers["X-RateLimit-Remaining"] = str(rate_limiter.get_remaining(client_ip))
    return response

# Request timing middleware
@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Response-Time"] = f"{duration:.3f}s"
    return response

# --- Lifecycle Events ---

@app.on_event("startup")
async def startup():
    """Load models when the server starts."""
    print("🚀 Starting DualMind ML API Server...")
    os.makedirs(MODEL_DIR, exist_ok=True)
    models.load()
    print(f"📡 API ready — docs at http://localhost:8000/docs")

@app.on_event("shutdown")
async def shutdown():
    """Clean up on server shutdown."""
    cache.clear()
    print("👋 Server shutting down")

# ═══════════════════════════════════════════════════
# API Endpoints
# ═══════════════════════════════════════════════════

@app.get("/api/ml/health")
async def health_check():
    """Health check — used by frontend MLClient to verify connectivity."""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "server": "fastapi",
        "models": models.status,
        "cache_size": cache.size
    }


@app.post("/api/ml/predict/skill")
async def predict_skill(request: SkillPredictRequest):
    """
    Predict skill tier (Novice → Expert) from gameplay features.
    Uses trained RandomForest/XGBoost model with LRU cache.
    """
    features = normalize_feature_keys(request.features)
    
    # Cache-Aside pattern: check cache first
    cache_key = f"skill:{hash_features(features)}"
    cached = cache.get(cache_key)
    if cached:
        cached['cache_hit'] = True
        return {"prediction": cached}
    
    # Model inference
    if models.skill_predictor and models.skill_predictor.is_trained:
        result = models.skill_predictor.predict(features)
        result['model_type'] = models.skill_predictor.model_type
    else:
        result = _fallback_skill_prediction(features)
        result['model_type'] = 'fallback'
    
    result['cache_hit'] = False
    models.prediction_count += 1
    
    # Store in cache
    cache.set(cache_key, result)
    
    return {"prediction": result}


@app.post("/api/ml/predict/performance")
async def predict_performance(request: PerformancePredictRequest):
    """
    Estimate performance index (0-100) from gameplay features.
    """
    features = normalize_feature_keys(request.features)
    
    cache_key = f"perf:{hash_features(features)}"
    cached = cache.get(cache_key)
    if cached:
        cached['cache_hit'] = True
        return {"prediction": cached}
    
    if models.performance_estimator and models.performance_estimator.is_trained:
        result = models.performance_estimator.predict(features)
        result['model_type'] = models.performance_estimator.model_type
    else:
        result = _fallback_performance_estimation(features)
        result['model_type'] = 'fallback'
    
    result['cache_hit'] = False
    models.prediction_count += 1
    cache.set(cache_key, result)
    
    return {"prediction": result}


@app.post("/api/ml/analyze/trends")
async def analyze_trends(request: TrendAnalysisRequest):
    """Analyze performance trends from session history."""
    if not request.sessions:
        raise HTTPException(status_code=400, detail="Empty sessions list")
    
    result = models.trend_analyzer.analyze(request.sessions)
    return {"analysis": result}


@app.post("/api/ml/predict/batch")
async def predict_batch(request: BatchPredictRequest):
    """
    Batch prediction — process multiple feature sets in one request.
    More efficient than individual calls for bulk analysis.
    """
    results = []
    
    for features in request.features_list:
        if request.prediction_type == "skill":
            if models.skill_predictor and models.skill_predictor.is_trained:
                result = models.skill_predictor.predict(features)
            else:
                result = _fallback_skill_prediction(features)
        else:
            if models.performance_estimator and models.performance_estimator.is_trained:
                result = models.performance_estimator.predict(features)
            else:
                result = _fallback_performance_estimation(features)
        
        results.append(result)
    
    models.prediction_count += len(results)
    return {"predictions": results}


@app.get("/api/ml/stats")
async def server_stats():
    """Server statistics for monitoring."""
    return {
        "predictions_served": models.prediction_count,
        "cache_size": cache.size,
        "cache_max": cache.max_size,
        "models": models.status,
        "uptime_info": "Use /api/ml/health for liveness check"
    }


# ═══════════════════════════════════════════════════
# Fallback Predictions (when models not loaded)
# ═══════════════════════════════════════════════════

def _fallback_skill_prediction(features: dict) -> dict:
    """Rule-based fallback for skill prediction."""
    weights = {
        'move_accuracy': 0.25,
        'pattern_success_rate': 0.20,
        'consistency_score': 0.15,
        'optimal_play_rate': 0.20,
        'decision_speed': 0.10,
        'error_penalty': 0.10
    }
    
    avg_time = features.get('avg_decision_time', 3000)
    if avg_time < 500:      decision_speed = 0.5
    elif avg_time < 1500:   decision_speed = 1.0
    elif avg_time < 3000:   decision_speed = 0.8
    elif avg_time < 5000:   decision_speed = 0.6
    else:                   decision_speed = 0.4
    
    error_penalty = 1 - features.get('error_rate', 0.2)
    
    score = 0
    score += features.get('move_accuracy', 0.5) * weights['move_accuracy'] * 100
    score += features.get('pattern_success_rate', 0.5) * weights['pattern_success_rate'] * 100
    score += features.get('consistency_score', 0.5) * weights['consistency_score'] * 100
    score += features.get('optimal_play_rate', 0.3) * weights['optimal_play_rate'] * 100
    score += decision_speed * weights['decision_speed'] * 100
    score += error_penalty * weights['error_penalty'] * 100
    
    tiers = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert']
    if score >= 85:     tier_idx = 4
    elif score >= 70:   tier_idx = 3
    elif score >= 50:   tier_idx = 2
    elif score >= 30:   tier_idx = 1
    else:               tier_idx = 0
    
    return {
        'skill_tier': tiers[tier_idx],
        'skill_tier_index': tier_idx,
        'confidence': 0.6,
        'probabilities': {tier: 0.1 for tier in tiers},
        'explanation': f"Fallback: {score:.0f} weighted score → {tiers[tier_idx]}",
        'warning': 'Using rule-based fallback — trained model not loaded'
    }


def _fallback_performance_estimation(features: dict) -> dict:
    """Rule-based fallback for performance estimation."""
    score = 50
    score += (features.get('move_accuracy', 0.5) - 0.5) * 50
    
    avg_time = features.get('avg_decision_time', 3000)
    if avg_time < 2000:     score += 10
    elif avg_time < 4000:   score += 5
    elif avg_time > 6000:   score -= 5
    
    score += (features.get('consistency_score', 0.5) - 0.5) * 20
    score = max(0, min(100, score))
    
    if score >= 90:     tier = 'Expert'
    elif score >= 75:   tier = 'Advanced'
    elif score >= 55:   tier = 'Intermediate'
    elif score >= 35:   tier = 'Beginner'
    else:               tier = 'Novice'
    
    return {
        'performance_index': round(score, 1),
        'skill_tier': tier,
        'uncertainty': 10.0,
        'confidence_interval': {'low': max(0, score - 15), 'high': min(100, score + 15)},
        'explanation': f"Fallback: {score:.0f} ({tier})"
    }


# ═══════════════════════════════════════════════════
# Main Entry Point
# ═══════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", os.environ.get("ML_API_PORT", 10000)))
    is_dev = os.environ.get("ENV", "production") == "development"
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        reload=is_dev,
        log_level="info"
    )
