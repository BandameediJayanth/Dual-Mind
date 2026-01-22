/**
 * ML Module Index
 * 
 * ARCHITECTURE NOTES:
 * - All ML training and inference is handled by Python (Random Forest / XGBoost)
 * - JavaScript only:
 *   1. Extracts features from gameplay (FeatureExtractor)
 *   2. Sends features to Python API and receives predictions (MLClient)
 * - Rule-based fallbacks are used ONLY when Python service is unavailable
 * 
 * FORBIDDEN in JavaScript:
 * - TensorFlow.js
 * - Brain.js
 * - Any JS-based ML training or inference
 */

export { FeatureExtractor } from './FeatureExtractor.js';
export { MLClient } from './MLClient.js';

// Legacy export for backward compatibility
// MLInference is deprecated - use MLClient instead
export { MLClient as MLInference } from './MLClient.js';
