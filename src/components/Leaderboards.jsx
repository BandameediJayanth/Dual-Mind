import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import './Leaderboards.css';

// Initialize Supabase fallback safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// --- Codename Generator ---
const adjectives = ['Quantum', 'Neon', 'Cyber', 'Silver', 'Golden', 'Electric', 'Shadow', 'Crimson', 'Astral', 'Nexus', 'Frozen', 'Blazing', 'Silent', 'Lunar', 'Solar', 'Cosmic', 'Hyper'];
const nouns = ['Fox', 'Owl', 'Wolf', 'Raven', 'Ninja', 'Phoenix', 'Dragon', 'Tiger', 'Shark', 'Falcon', 'Ghost', 'Samurai', 'Viper', 'Lynx', 'Griffin', 'Panther', 'Bear'];

function uuidToName(uuid) {
  if (!uuid) return 'Unknown Player';
  // simple hash
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = uuid.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  const adjName = adjectives[hash % adjectives.length];
  const nounName = nouns[(hash >> 2) % nouns.length];
  // grab short version of uuid for uniqueness
  const tag = uuid.substring(uuid.length - 4).toUpperCase();
  return `${adjName} ${nounName} #${tag}`;
}

const containerAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemAnim = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Leaderboards() {
  const [loading, setLoading] = useState(true);
  const [topPerformers, setTopPerformers] = useState([]);
  const [fastestThinkers, setFastestThinkers] = useState([]);
  const [veterans, setVeterans] = useState([]);

  useEffect(() => {
    async function fetchLeaderboards() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Fetch up to 500 recent sessions with their associated predictions if any.
        // Doing this client-side for rapid prototyping without needing backend RPCs.
        const { data: sessionsData, error: sessionErr } = await supabase
          .from('sessions')
          .select(`
            player_id, 
            game_id, 
            session_duration_ms, 
            total_moves, 
            features, 
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(500);

        const { data: predictionsData, error: predErr } = await supabase
          .from('predictions')
          .select(`
            session_id,
            performance_index,
            sessions (player_id)
          `)
          .order('performance_index', { ascending: false })
          .limit(200);

        if (sessionErr) throw sessionErr;

        // 1. Top Performers (Highest Performance Index)
        const performersMap = new Map();
        if (predictionsData) {
          predictionsData.forEach((pred) => {
            const pid = pred.sessions?.player_id;
            if (!pid) return;
            const pi = parseFloat(pred.performance_index);
            if (!performersMap.has(pid) || performersMap.get(pid).pi < pi) {
              performersMap.set(pid, { player: uuidToName(pid), pi });
            }
          });
        }
        const topPerf = Array.from(performersMap.values())
          .sort((a, b) => b.pi - a.pi)
          .slice(0, 10);

        // 2. Fastest Thinkers (Lowest Decision Time over > 5 moves)
        const thinkersMap = new Map();
        if (sessionsData) {
          sessionsData.forEach((s) => {
            if (s.total_moves > 5 && s.session_duration_ms > 0) {
              const pid = s.player_id;
              const avgMoves = s.session_duration_ms / s.total_moves;
              if (!thinkersMap.has(pid) || thinkersMap.get(pid).avgMs > avgMoves) {
                thinkersMap.set(pid, { player: uuidToName(pid), avgMs: avgMoves, game: s.game_id });
              }
            }
          });
        }
        const topThinkers = Array.from(thinkersMap.values())
          .sort((a, b) => a.avgMs - b.avgMs)
          .slice(0, 10);

        // 3. Veterans (Most Games Played in Recent 500)
        const countsMap = new Map();
        if (sessionsData) {
          sessionsData.forEach((s) => {
            countsMap.set(s.player_id, (countsMap.get(s.player_id) || 0) + 1);
          });
        }
        const topVets = Array.from(countsMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([pid, count]) => ({ player: uuidToName(pid), count }));

        setTopPerformers(topPerf);
        setFastestThinkers(topThinkers);
        setVeterans(topVets);
      } catch (err) {
        console.error("Leaderboard fetch error", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboards();
  }, []);

  if (loading) {
    return (
      <div className="leaderboards-loading">
        <div className="ml-spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
        <p>Quantum resolving global neural networks...</p>
      </div>
    );
  }

  return (
    <section className="leaderboards" id="leaderboards">
      <div className="container">
        <div className="leaderboards-header">
          <h2 className="leaderboards-title">Global <span className="gradient-text">Leaderboards</span></h2>
          <p className="leaderboards-subtitle">Anonymized rankings extrapolated from live cognitive metrics</p>
        </div>

        <motion.div 
          className="leaderboards-grid"
          variants={containerAnim}
          initial="initial"
          animate="animate"
        >
          {/* Card 1: Top Performers */}
          <motion.div className="lb-card glass-card" variants={itemAnim}>
            <div className="lb-card-icon">🧠</div>
            <h3>Elite Performers</h3>
            <p className="lb-card-desc">Highest peak Performance Index across all games</p>
            <ul className="lb-list">
              {topPerformers.map((p, i) => (
                <li key={i} className="lb-item">
                  <span className="lb-rank">#{i + 1}</span>
                  <span className="lb-name">{p.player}</span>
                  <span className="lb-score">{p.pi.toFixed(1)} PI</span>
                </li>
              ))}
              {topPerformers.length === 0 && <li className="lb-empty">No data yet</li>}
            </ul>
          </motion.div>

          {/* Card 2: Fastest Thinkers */}
          <motion.div className="lb-card glass-card" variants={itemAnim}>
            <div className="lb-card-icon">⚡</div>
            <h3>Fastest Thinkers</h3>
            <p className="lb-card-desc">Lowest average decision time per move</p>
            <ul className="lb-list">
              {fastestThinkers.map((p, i) => (
                <li key={i} className="lb-item">
                  <span className="lb-rank">#{i + 1}</span>
                  <span className="lb-name">{p.player}</span>
                  <span className="lb-score">{(p.avgMs / 1000).toFixed(2)}s</span>
                </li>
              ))}
              {fastestThinkers.length === 0 && <li className="lb-empty">No data yet</li>}
            </ul>
          </motion.div>

          {/* Card 3: Most Active */}
          <motion.div className="lb-card glass-card" variants={itemAnim}>
            <div className="lb-card-icon">🏅</div>
            <h3>Veterans</h3>
            <p className="lb-card-desc">Most sessions played (Recent 500)</p>
            <ul className="lb-list">
              {veterans.map((p, i) => (
                <li key={i} className="lb-item">
                  <span className="lb-rank">#{i + 1}</span>
                  <span className="lb-name">{p.player}</span>
                  <span className="lb-score">{p.count} pts</span>
                </li>
              ))}
              {veterans.length === 0 && <li className="lb-empty">No data yet</li>}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
