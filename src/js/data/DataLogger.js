import { createClient } from '@supabase/supabase-js'

export class DataLogger {
  constructor() {
    this.supabase = null;
    this.playerId = this.getOrCreatePlayerId();
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && supabaseKey !== 'paste_your_anon_key_here') {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log("Supabase DataLogger initialized.");
      } catch (err) {
        console.warn("Failed to initialize Supabase client:", err);
      }
    } else {
      console.warn("Supabase credentials missing. Data logging disabled.");
    }
  }

  getOrCreatePlayerId() {
    let pid = localStorage.getItem('dualmind_player_id');
    if (!pid) {
      pid = crypto.randomUUID();
      localStorage.setItem('dualmind_player_id', pid);
    }
    return pid;
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language
    };
  }

  async logSessionAsync(sessionData) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase
        .from('sessions')
        .insert([{
          id: sessionData.id,
          player_id: this.playerId,
          game_id: sessionData.game_id,
          result: sessionData.result,
          total_moves: sessionData.total_moves,
          session_duration_ms: sessionData.session_duration_ms,
          features: sessionData.features,
          device_info: this.getDeviceInfo()
        }]);
      if (error) console.warn("Supabase logSession error:", error);
    } catch (err) {
      console.warn("Supabase logSession failed:", err);
    }
  }

  async logMoveAsync(sessionId, moveData) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase
        .from('moves')
        .insert([{
          session_id: sessionId,
          move_index: moveData.move_index,
          decision_time_ms: moveData.decision_time_ms,
          move_data: moveData.move_data,
          is_optimal: moveData.is_optimal,
          is_error: moveData.is_error
        }]);
      if (error) console.warn("Supabase logMove error:", error);
    } catch (err) {
      console.warn("Supabase logMove failed:", err);
    }
  }

  async logPredictionAsync(sessionId, predictionData) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase
        .from('predictions')
        .insert([{
          session_id: sessionId,
          skill_tier: predictionData.skill_tier,
          confidence: predictionData.confidence,
          performance_index: predictionData.performance_index,
          model_type: predictionData.model_type,
          features_hash: predictionData.features_hash || 'unknown'
        }]);
      if (error) console.warn("Supabase logPrediction error:", error);
    } catch (err) {
      console.warn("Supabase logPrediction failed:", err);
    }
  }
}

// Export singleton instance
export const dataLogger = new DataLogger();
