import { supabase } from "./supabase";

export class DataLogger {
  constructor() {
    this.supabase = supabase;
    this.playerId = this.getOrCreatePlayerId();

    if (this.supabase) {
      console.log("Supabase DataLogger initialized.");
    } else {
      console.warn("Supabase credentials missing. Data logging disabled.");
    }
  }

  getOrCreatePlayerId() {
    let pid = localStorage.getItem("dualmind_player_id");
    if (!pid) {
      pid = crypto.randomUUID();
      localStorage.setItem("dualmind_player_id", pid);
    }
    return pid;
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
    };
  }

  /**
   * Create a placeholder session row so moves can reference it via FK.
   * Called at the start of a game. Waits for completion so moves don't race ahead.
   */
  async createSessionAsync(sessionId, gameId) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase.from("sessions").insert([
        {
          id: sessionId,
          player_id: this.playerId,
          game_id: gameId,
          result: "in_progress",
          total_moves: 0,
          session_duration_ms: 0,
          features: null,
          device_info: this.getDeviceInfo(),
        },
      ]);
      if (error) {
        // RLS policy (42501) or auth (PGRST301 / HTTP 401) — disable logging for this session
        if (error.code === "42501" || error.code === "PGRST301" || error.message?.includes('Unauthorized')) {
          console.warn(
            "Supabase: auth/RLS blocked session insert. Data logging disabled for this session.",
          );
          this._loggingDisabled = true;
        } else {
          console.warn("Supabase createSession error:", error);
        }
      }
    } catch (err) {
      console.warn("Supabase createSession failed:", err);
      this._loggingDisabled = true;
    }
  }

  /**
   * Update the session row with final results when the game ends.
   */
  async logSessionAsync(sessionData) {
    if (!this.supabase || this._loggingDisabled) return;
    try {
      const { error } = await this.supabase.from("sessions").upsert(
        [
          {
            id: sessionData.id,
            player_id: this.playerId,
            game_id: sessionData.game_id,
            result: sessionData.result,
            total_moves: sessionData.total_moves,
            session_duration_ms: sessionData.session_duration_ms,
            features: sessionData.features,
            device_info: this.getDeviceInfo(),
          },
        ],
        { onConflict: "id" },
      );
      if (error) {
        if (error.code === "42501" || error.code === "PGRST301" || error.message?.includes('Unauthorized')) {
          this._loggingDisabled = true;
        } else {
          console.warn("Supabase logSession error:", error);
        }
      }
    } catch (err) {
      console.warn("Supabase logSession failed:", err);
    }
  }

  async logMoveAsync(sessionId, moveData) {
    if (!this.supabase || this._loggingDisabled) return;
    try {
      const { error } = await this.supabase.from("moves").insert([
        {
          session_id: sessionId,
          move_index: moveData.move_index,
          decision_time_ms: moveData.decision_time_ms,
          move_data: moveData.move_data,
          is_optimal: moveData.is_optimal,
          is_error: moveData.is_error,
        },
      ]);
      if (error) console.warn("Supabase logMove error:", error);
    } catch (err) {
      console.warn("Supabase logMove failed:", err);
    }
  }

  async logPredictionAsync(sessionId, predictionData) {
    if (!this.supabase || this._loggingDisabled) return;
    try {
      const { error } = await this.supabase.from("predictions").insert([
        {
          session_id: sessionId,
          skill_tier: predictionData.skill_tier,
          confidence: predictionData.confidence,
          performance_index: predictionData.performance_index,
          model_type: predictionData.model_type,
          features_hash: predictionData.features_hash || "unknown",
        },
      ]);
      if (error) console.warn("Supabase logPrediction error:", error);
    } catch (err) {
      console.warn("Supabase logPrediction failed:", err);
    }
  }
}

// Export singleton instance
export const dataLogger = new DataLogger();
