# Next Steps: Data Collection & Vercel Deployment Plan

> **Note for GitHub Copilot**: This document outlines the exact architecture, database schema, and implementation steps required to deploy the DualMind project to Vercel and collect real user gameplay data using Supabase.

## 1. The Architecture Strategy

Since Vercel's free tier only hosts static frontend files (React/Vite) and serverless functions (not long-running Python processes), the architecture for the public deployment will change slightly from local development:

- **Frontend**: Hosted on Vercel.
- **Backend (Python)**: Disabled for the public Vercel deployment.
- **ML Predictions**: The frontend will automatically trigger the existing **client-side rule-based fallback** in `MLClient.js` whenever it cannot reach the Python backend.
- **Data Collection**: The React frontend will send gameplay data **directly to Supabase** (PostgreSQL) using the Supabase JS client.

This allows us to deploy the app for free, collect thousands of real gameplay sessions, and later use that data to train our LightGBM/LSTM models offline.

---

## 2. Supabase Setup & Schema

Supabase provides a free PostgreSQL database with an auto-generated API. 

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Get the **Project URL** and **anon public key** from the API settings.
3. Save them in an `.env.local` file at the root of the project:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### Step 2: Run SQL Commands (Database Schema)
Run these commands in the Supabase SQL Editor to create the 3 core tables:

```sql
-- Table 1: Per-Session Aggregates
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  player_id TEXT,             -- Anonymous fingerprint (crypto.randomUUID)
  game_id TEXT NOT NULL,      -- 'tictactoe', 'checkers', etc.
  result TEXT,                -- 'win', 'loss', 'draw'
  total_moves INT,
  session_duration_ms INT,
  features JSONB,             -- The 15+ extracted features (avg_decision_time, etc.)
  device_info JSONB           -- User Agent, screen size
);

-- Table 2: Per-Move Raw Data (Goldmine for sequence modeling)
CREATE TABLE moves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  move_index INT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  decision_time_ms INT,       -- ms since previous move
  move_data JSONB,            -- Raw game-specific move array/object
  is_optimal BOOLEAN,         -- If tracked by the engine
  is_error BOOLEAN            -- If tracked by the engine
);

-- Table 3: ML Prediction Logs
CREATE TABLE predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  skill_tier TEXT,            -- e.g., 'Advanced'
  confidence FLOAT,           -- e.g., 0.85
  performance_index FLOAT,    -- e.g., 82.5
  model_type TEXT,            -- 'fallback' or 'random_forest'
  features_hash TEXT          -- Used to track identical feature vectors
);

-- Enable Row Level Security (RLS) allowing anonymous inserts
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous inserts" ON moves FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous inserts" ON predictions FOR INSERT WITH CHECK (true);
```

---

## 3. Implementation Steps for GitHub Copilot

### Phase A: Integrate Supabase Client
1. Install Supabase wrapper: `npm install @supabase/supabase-js`
2. Create `src/js/data/DataLogger.js`:
   - Initialize Supabase client using env vars.
   - Setup a `uid` in localStorage if it doesn't exist (`crypto.randomUUID()`).
   - Implement `logSessionAsync(sessionData)`
   - Implement `logMoveAsync(sessionId, moveData)`
   - Implement `logPredictionAsync(sessionId, predictionData)`
   - Wrap all API calls in `try/catch` so a database failure **never crashes the game**.

### Phase B: Hook up GameView & MLProvider
1. In `src/components/GameView.jsx`:
   - Generate a `session_id` at the start of a game.
   - Inside the `handleGameMove` listener, call `DataLogger.logMoveAsync(...)`.
   - On `handleGameEnd`, call `DataLogger.logSessionAsync(...)` right before extracting features.
2. In `src/components/MLProvider.jsx`:
   - In `endSessionAndPredict`, after getting the prediction from `MLClient.js` (whether from API or fallback), call `DataLogger.logPredictionAsync(...)`.

### Phase C: UI Tweaks
1. Add a small, non-intrusive Data Collection Consent Banner (stored in localStorage) letting users know gameplay is tracked anonymously for ML research.

---

## 4. Vercel Deployment

1. Make sure all code is committed to GitHub.
2. Go to [vercel.com](https://vercel.com/new).
3. Import the `Dual-Mind` repository.
4. Framework Preset: **Vite**
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. **Environment Variables**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
8. Click **Deploy**.

The site will now be live. Players will receive fallback ML predictions, and their rich gameplay data will stream directly into your Supabase database, ready for you and your AI engineer friend to analyze and train the next generation of models!
