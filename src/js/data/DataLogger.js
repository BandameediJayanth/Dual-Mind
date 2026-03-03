import { supabase } from "./supabase";

export class DataLogger {
  constructor() {
    this.supabase = supabase;
    this.playerId = this.getOrCreatePlayerId();
    this._loggingDisabled = false;
    // Promise that resolves once the session row exists (or failed).
    // All other log methods await this so they never race ahead.
    this._sessionReady = Promise.resolve();

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
   * Stores a promise that all other log methods await before proceeding.
   * If this fails for ANY reason, logging is disabled for the rest of the session.
   */
  createSessionAsync(sessionId, gameId) {
    if (!this.supabase) return;
    // Respect user consent — if explicitly declined, disable Supabase logging for this session
    if (localStorage.getItem("dualmind_data_consent") === "false") {
      this._loggingDisabled = true;
      return;
    }
    // Store the promise — logMoveAsync / logSessionAsync will await it
    this._sessionReady = this._insertSession(sessionId, gameId);
    return this._sessionReady;
  }

  async _insertSession(sessionId, gameId) {
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
        console.warn(
          "Supabase: session insert failed — data logging disabled for this session.",
          error.message || error,
        );
        this._loggingDisabled = true;
      }
    } catch (err) {
      console.warn(
        "Supabase: session insert failed — data logging disabled.",
        err,
      );
      this._loggingDisabled = true;
    }
  }

  /**
   * Update the session row with final results when the game ends.
   */
  async logSessionAsync(sessionData) {
    if (!this.supabase) return;
    // Wait for session creation to finish (success or failure)
    await this._sessionReady;
    if (this._loggingDisabled) return;
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
        console.warn("Supabase logSession error:", error);
        this._loggingDisabled = true;
      }
    } catch (err) {
      console.warn("Supabase logSession failed:", err);
    }
  }

  async logMoveAsync(sessionId, moveData) {
    if (!this.supabase) return;
    // Wait for session creation to finish (success or failure)
    await this._sessionReady;
    if (this._loggingDisabled) return;
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
    if (!this.supabase) return;
    await this._sessionReady;
    if (this._loggingDisabled) return;
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
