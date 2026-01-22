/**
 * Dashboard.js
 * Performance insights dashboard displaying ML predictions and game statistics
 */

export class Dashboard {
    constructor(options = {}) {
        this.container = options.container || null;
        this.storageManager = options.storageManager || null;
        this.mlClient = options.mlClient || null;
        this.analyticsEngine = options.analyticsEngine || null;
        
        this.stats = {
            totalGames: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalPlayTime: 0,
            currentStreak: 0,
            bestStreak: 0,
            performanceIndex: 0,
            skillTier: 'Unknown',
            gameStats: {}
        };
        
        this.chartColors = [
            '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
            '#E91E63', '#00BCD4', '#8BC34A', '#FF5722',
            '#673AB7', '#009688'
        ];
    }
    
    /**
     * Initialize the dashboard
     */
    async init() {
        await this.loadStats();
        this.render();
    }
    
    /**
     * Load stats from storage and ML predictions
     */
    async loadStats() {
        // Load from storage
        if (this.storageManager) {
            const sessions = await this.storageManager.getSessions?.() || [];
            this._calculateStats(sessions);
        }
        
        // Get ML predictions
        if (this.mlClient && this.analyticsEngine) {
            try {
                const features = this.analyticsEngine.getCurrentFeatures?.() || {};
                const prediction = await this.mlClient.predictSkillTier?.(features);
                if (prediction) {
                    this.stats.skillTier = prediction.tier || 'Unknown';
                    this.stats.performanceIndex = prediction.performanceIndex || 0;
                }
            } catch (e) {
                console.warn('Could not load ML predictions:', e);
            }
        }
    }
    
    /**
     * Calculate statistics from session data
     */
    _calculateStats(sessions) {
        this.stats.totalGames = sessions.length;
        this.stats.gamesWon = sessions.filter(s => s.result === 'win').length;
        this.stats.gamesLost = sessions.filter(s => s.result === 'loss').length;
        this.stats.totalPlayTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        
        // Calculate streaks
        let currentStreak = 0;
        let bestStreak = 0;
        let streakType = null;
        
        for (const session of sessions.slice().reverse()) {
            if (streakType === null) {
                streakType = session.result;
                currentStreak = 1;
            } else if (session.result === streakType) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        // Only count win streaks
        if (streakType === 'win') {
            this.stats.currentStreak = currentStreak;
        }
        
        // Calculate best streak
        let tempStreak = 0;
        for (const session of sessions) {
            if (session.result === 'win') {
                tempStreak++;
                bestStreak = Math.max(bestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }
        this.stats.bestStreak = bestStreak;
        
        // Per-game stats
        this.stats.gameStats = {};
        for (const session of sessions) {
            const game = session.gameId || 'unknown';
            if (!this.stats.gameStats[game]) {
                this.stats.gameStats[game] = { played: 0, won: 0, avgTime: 0, times: [] };
            }
            this.stats.gameStats[game].played++;
            if (session.result === 'win') this.stats.gameStats[game].won++;
            if (session.duration) this.stats.gameStats[game].times.push(session.duration);
        }
        
        // Calculate average times
        for (const game in this.stats.gameStats) {
            const times = this.stats.gameStats[game].times;
            if (times.length > 0) {
                this.stats.gameStats[game].avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            }
        }
    }
    
    /**
     * Render the dashboard
     */
    render() {
        if (!this.container) {
            this.container = document.getElementById('dashboard');
        }
        if (!this.container) {
            console.warn('Dashboard container not found');
            return;
        }
        
        this.container.innerHTML = `
            <div class="dashboard">
                <h2>📊 Performance Dashboard</h2>
                
                <!-- Performance Index Card -->
                <div class="dashboard-section performance-section">
                    <h3>Performance Index</h3>
                    <div class="performance-display">
                        <div class="performance-gauge">
                            ${this._renderGauge(this.stats.performanceIndex)}
                        </div>
                        <div class="performance-info">
                            <div class="skill-tier tier-${this.stats.skillTier.toLowerCase()}">
                                ${this.stats.skillTier}
                            </div>
                            <p class="disclaimer">
                                ⚠️ This is a non-clinical performance assessment for entertainment only.
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Stats -->
                <div class="dashboard-section stats-grid">
                    ${this._renderStatCard('🎮', 'Games Played', this.stats.totalGames)}
                    ${this._renderStatCard('🏆', 'Games Won', this.stats.gamesWon)}
                    ${this._renderStatCard('📈', 'Win Rate', this._getWinRate() + '%')}
                    ${this._renderStatCard('⏱️', 'Total Time', this._formatTime(this.stats.totalPlayTime))}
                    ${this._renderStatCard('🔥', 'Current Streak', this.stats.currentStreak)}
                    ${this._renderStatCard('⭐', 'Best Streak', this.stats.bestStreak)}
                </div>
                
                <!-- Game Breakdown -->
                <div class="dashboard-section">
                    <h3>📋 Game Breakdown</h3>
                    <div class="game-breakdown">
                        ${this._renderGameBreakdown()}
                    </div>
                </div>
                
                <!-- Recent Activity Chart -->
                <div class="dashboard-section">
                    <h3>📈 Performance Trend</h3>
                    <canvas id="trend-chart" width="600" height="200"></canvas>
                </div>
                
                <!-- Export/Clear Actions -->
                <div class="dashboard-actions">
                    <button id="export-data" class="btn btn-secondary">📤 Export Data</button>
                    <button id="clear-data" class="btn btn-danger">🗑️ Clear History</button>
                </div>
            </div>
        `;
        
        this._attachEventListeners();
        this._renderTrendChart();
    }
    
    /**
     * Render a gauge for the performance index
     */
    _renderGauge(value) {
        const percentage = Math.min(100, Math.max(0, value));
        const angle = (percentage / 100) * 180;
        const color = this._getPerformanceColor(percentage);
        
        return `
            <svg viewBox="0 0 200 120" class="gauge-svg">
                <!-- Background arc -->
                <path d="M 20 100 A 80 80 0 0 1 180 100" 
                      fill="none" stroke="#e0e0e0" stroke-width="15"/>
                <!-- Value arc -->
                <path d="M 20 100 A 80 80 0 0 1 180 100" 
                      fill="none" stroke="${color}" stroke-width="15"
                      stroke-dasharray="${percentage * 2.51} 251"
                      class="gauge-value"/>
                <!-- Center value -->
                <text x="100" y="90" text-anchor="middle" class="gauge-text">
                    ${Math.round(value)}
                </text>
                <text x="100" y="110" text-anchor="middle" class="gauge-label">
                    Performance Index
                </text>
            </svg>
        `;
    }
    
    /**
     * Get color based on performance value
     */
    _getPerformanceColor(value) {
        if (value >= 80) return '#4CAF50'; // Green
        if (value >= 60) return '#8BC34A'; // Light Green
        if (value >= 40) return '#FF9800'; // Orange
        if (value >= 20) return '#FF5722'; // Deep Orange
        return '#F44336'; // Red
    }
    
    /**
     * Render a stat card
     */
    _renderStatCard(icon, label, value) {
        return `
            <div class="stat-card">
                <div class="stat-icon">${icon}</div>
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
            </div>
        `;
    }
    
    /**
     * Calculate win rate
     */
    _getWinRate() {
        if (this.stats.totalGames === 0) return 0;
        return Math.round((this.stats.gamesWon / this.stats.totalGames) * 100);
    }
    
    /**
     * Format time in minutes/hours
     */
    _formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return `${hours}h ${remainingMins}m`;
    }
    
    /**
     * Render game breakdown table
     */
    _renderGameBreakdown() {
        const games = Object.entries(this.stats.gameStats);
        
        if (games.length === 0) {
            return '<p class="no-data">No games played yet. Start playing to see your stats!</p>';
        }
        
        return `
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th>Game</th>
                        <th>Played</th>
                        <th>Won</th>
                        <th>Win Rate</th>
                        <th>Avg Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${games.map(([name, stats]) => `
                        <tr>
                            <td>${this._formatGameName(name)}</td>
                            <td>${stats.played}</td>
                            <td>${stats.won}</td>
                            <td>${stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%</td>
                            <td>${this._formatTime(stats.avgTime)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    /**
     * Format game name for display
     */
    _formatGameName(name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
    
    /**
     * Render trend chart using Canvas
     */
    _renderTrendChart() {
        const canvas = document.getElementById('trend-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, width, height);
        
        // Sample data (would come from actual session history)
        const data = this._getTrendData();
        
        if (data.length < 2) {
            ctx.fillStyle = '#666';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Play more games to see your performance trend!', width / 2, height / 2);
            return;
        }
        
        // Draw axes
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw data line
        const xStep = chartWidth / (data.length - 1);
        const maxVal = Math.max(...data.map(d => d.value), 100);
        
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, i) => {
            const x = padding + i * xStep;
            const y = height - padding - (point.value / maxVal) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = '#2196F3';
        data.forEach((point, i) => {
            const x = padding + i * xStep;
            const y = height - padding - (point.value / maxVal) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw labels
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        
        // X-axis labels (dates)
        data.forEach((point, i) => {
            if (i % Math.ceil(data.length / 5) === 0 || i === data.length - 1) {
                const x = padding + i * xStep;
                ctx.fillText(point.label, x, height - 10);
            }
        });
        
        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const val = Math.round(maxVal * (i / 4));
            const y = height - padding - (i / 4) * chartHeight;
            ctx.fillText(val.toString(), padding - 5, y + 3);
        }
    }
    
    /**
     * Get trend data from sessions
     */
    _getTrendData() {
        // Mock data - would come from actual sessions
        // In real implementation, aggregate by day/session
        return [
            { label: 'Day 1', value: 45 },
            { label: 'Day 2', value: 52 },
            { label: 'Day 3', value: 48 },
            { label: 'Day 4', value: 61 },
            { label: 'Day 5', value: 58 },
            { label: 'Day 6', value: 65 },
            { label: 'Day 7', value: 72 }
        ];
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        const exportBtn = document.getElementById('export-data');
        const clearBtn = document.getElementById('clear-data');
        
        if (exportBtn) {
            exportBtn.onclick = () => this.exportData();
        }
        
        if (clearBtn) {
            clearBtn.onclick = () => this.clearData();
        }
    }
    
    /**
     * Export user data as JSON
     */
    async exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            stats: this.stats,
            sessions: await this.storageManager?.getSessions?.() || []
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-suite-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Clear all user data
     */
    async clearData() {
        if (confirm('Are you sure you want to clear all your game history? This cannot be undone.')) {
            await this.storageManager?.clearAll?.();
            this.stats = {
                totalGames: 0,
                gamesWon: 0,
                gamesLost: 0,
                totalPlayTime: 0,
                currentStreak: 0,
                bestStreak: 0,
                performanceIndex: 0,
                skillTier: 'Unknown',
                gameStats: {}
            };
            this.render();
        }
    }
    
    /**
     * Update with new session data
     */
    update(session) {
        this.loadStats().then(() => this.render());
    }
    
    /**
     * Show/hide dashboard
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }
    
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    toggle() {
        if (this.container) {
            const isVisible = this.container.style.display !== 'none';
            this.container.style.display = isVisible ? 'none' : 'block';
        }
    }
}

export default Dashboard;
