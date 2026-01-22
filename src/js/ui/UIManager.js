/**
 * UIManager - User Interface Management
 * Handles rendering, updates, and UI interactions
 */

import { GAMES } from '../core/GameController.js';

export class UIManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // UI element references
        this.elements = {};
        
        // Toast queue
        this.toastQueue = [];
        this.isShowingToast = false;
    }

    /**
     * Initialize the UI manager
     */
    init() {
        // Cache DOM element references
        this.cacheElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('🎨 UI Manager initialized');
    }

    /**
     * Cache frequently accessed DOM elements
     */
    cacheElements() {
        this.elements = {
            // Views
            viewHome: document.getElementById('view-home'),
            viewGames: document.getElementById('view-games'),
            viewGameplay: document.getElementById('view-gameplay'),
            viewAnalytics: document.getElementById('view-analytics'),
            viewSettings: document.getElementById('view-settings'),
            
            // Game grid
            gameGrid: document.getElementById('game-grid'),
            
            // Game play
            gameTitle: document.getElementById('current-game-title'),
            turnIndicator: document.getElementById('turn-indicator'),
            gameCanvas: document.getElementById('game-canvas'),
            gameBoard: document.getElementById('game-board'),
            player1Card: document.getElementById('player1-card'),
            player2Card: document.getElementById('player2-card'),
            
            // Stats
            statGamesPlayed: document.getElementById('stat-games-played'),
            statPerformanceIndex: document.getElementById('stat-performance-index'),
            statSkillTier: document.getElementById('stat-skill-tier'),
            
            // Analytics
            performanceDisplay: document.getElementById('performance-display'),
            tierDisplay: document.getElementById('tier-display'),
            trendChart: document.getElementById('trend-chart'),
            featureImportance: document.getElementById('feature-importance'),
            sessionHistory: document.getElementById('session-history'),
            confidenceFill: document.getElementById('confidence-fill'),
            
            // Modal
            modalContainer: document.getElementById('modal-container'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalFooter: document.getElementById('modal-footer'),
            
            // Toast
            toastContainer: document.getElementById('toast-container'),
            
            // Loading
            loadingOverlay: document.getElementById('loading-overlay')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Modal close
        this.elements.modalContainer?.querySelector('.modal__close')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        this.elements.modalContainer?.querySelector('.modal-overlay')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * Render the game selection grid
     */
    renderGameGrid() {
        if (!this.elements.gameGrid) return;
        
        const games = Object.values(GAMES);
        
        this.elements.gameGrid.innerHTML = games.map(game => `
            <div class="card game-card" data-game-id="${game.id}" role="button" tabindex="0" aria-label="Play ${game.name}">
                <div class="game-card__icon">${game.icon}</div>
                <span class="game-card__badge">${game.difficulty}</span>
                <div class="card__content">
                    <span class="game-card__category">${game.category}</span>
                    <h3 class="card__title">${game.name}</h3>
                    <p class="card__description">${game.description}</p>
                </div>
                <div class="card__footer">
                    <span>${game.players} Player${game.players > 1 ? 's' : ''}</span>
                    <button class="btn btn--primary btn--small">Play</button>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        this.elements.gameGrid.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.gameId;
                this.eventBus.emit('game:select', gameId);
            });
            
            // Keyboard support
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const gameId = card.dataset.gameId;
                    this.eventBus.emit('game:select', gameId);
                }
            });
        });
    }

    /**
     * Update game UI for specific game
     * @param {string} gameId - Game identifier
     */
    updateGameUI(gameId) {
        const gameInfo = GAMES[gameId];
        
        if (this.elements.gameTitle) {
            this.elements.gameTitle.textContent = gameInfo.name;
        }
        
        // Reset player cards
        this.updatePlayerCard(1, { name: 'Player 1', score: 0, active: true });
        this.updatePlayerCard(2, { name: 'Player 2', score: 0, active: false });
        
        // Update turn indicator
        this.updateTurnIndicator(1);
    }

    /**
     * Update player card
     * @param {number} player - Player number (1 or 2)
     * @param {Object} data - Player data
     */
    updatePlayerCard(player, data) {
        const card = player === 1 ? this.elements.player1Card : this.elements.player2Card;
        if (!card) return;
        
        const nameEl = card.querySelector('.player-card__name');
        const scoreEl = card.querySelector('.player-card__score');
        
        if (nameEl) nameEl.textContent = data.name;
        if (scoreEl) scoreEl.textContent = data.score;
        
        card.classList.toggle('player-card--active', data.active);
    }

    /**
     * Update turn indicator
     * @param {number} player - Current player
     */
    updateTurnIndicator(player) {
        if (this.elements.turnIndicator) {
            this.elements.turnIndicator.textContent = `Player ${player}'s Turn`;
        }
        
        // Update player card active states
        this.elements.player1Card?.classList.toggle('player-card--active', player === 1);
        this.elements.player2Card?.classList.toggle('player-card--active', player === 2);
    }

    /**
     * Update quick stats display
     * @param {Object} stats - Statistics object
     */
    updateQuickStats(stats) {
        if (this.elements.statGamesPlayed) {
            this.elements.statGamesPlayed.textContent = stats.gamesPlayed || 0;
        }
    }

    /**
     * Update performance index display
     * @param {number} index - Performance index value
     * @param {number} confidence - Confidence percentage
     */
    updatePerformanceIndex(index, confidence = 0) {
        if (this.elements.statPerformanceIndex) {
            this.elements.statPerformanceIndex.textContent = index || '--';
        }
        
        if (this.elements.confidenceFill) {
            this.elements.confidenceFill.style.width = `${confidence}%`;
        }
        
        const performanceValue = this.elements.performanceDisplay?.querySelector('.performance-value');
        if (performanceValue) {
            performanceValue.textContent = index || '--';
        }
    }

    /**
     * Update skill tier display
     * @param {string} tier - Skill tier name
     */
    updateSkillTier(tier) {
        if (this.elements.statSkillTier) {
            this.elements.statSkillTier.textContent = tier || 'Novice';
        }
        
        if (this.elements.tierDisplay) {
            const tierLower = (tier || 'novice').toLowerCase();
            this.elements.tierDisplay.innerHTML = `
                <span class="tier-badge tier-badge--${tierLower}">${tier || 'Novice'}</span>
            `;
        }
    }

    /**
     * Update settings UI from settings object
     * @param {Object} settings - Settings object
     */
    updateSettingsUI(settings) {
        const settingsMap = {
            darkMode: 'setting-dark-mode',
            animations: 'setting-animations',
            sound: 'setting-sound',
            highContrast: 'setting-contrast',
            largeText: 'setting-large-text',
            iqMonitoring: 'setting-iq-monitoring',
            storeData: 'setting-store-data'
        };
        
        Object.entries(settingsMap).forEach(([key, id]) => {
            const element = document.getElementById(id);
            if (element && settings[key] !== undefined) {
                element.checked = settings[key];
            }
        });
    }

    /**
     * Show game result
     * @param {Object} result - Game result object
     */
    showGameResult(result) {
        let title, subtitle;
        
        if (result.winner === 'draw') {
            title = "It's a Draw!";
            subtitle = 'Great game!';
        } else if (result.winner) {
            title = `Player ${result.winner} Wins!`;
            subtitle = result.winReason || 'Congratulations!';
        } else {
            title = 'Game Over';
            subtitle = 'Thanks for playing!';
        }
        
        this.openModal({
            title: '🎮 Game Over',
            body: `
                <div class="text-center">
                    <div class="game-result-overlay__title" style="font-size: 2rem; margin-bottom: 1rem;">
                        ${title}
                    </div>
                    <div class="game-result-overlay__subtitle" style="color: var(--text-secondary); margin-bottom: 1rem;">
                        ${subtitle}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-muted);">
                        Moves: ${result.moveCount} | Duration: ${this.formatDuration(result.sessionDuration)}
                    </div>
                    ${result.mlPrediction ? `
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 0.5rem;">
                            <div style="font-weight: 600;">Performance Analysis</div>
                            <div>Skill Tier: ${result.mlPrediction.skillTier}</div>
                            <div>Confidence: ${result.mlPrediction.confidence}%</div>
                        </div>
                    ` : ''}
                </div>
            `,
            footer: `
                <button class="btn btn--secondary" data-action="quit">Quit</button>
                <button class="btn btn--primary" data-action="restart">Play Again</button>
            `,
            onAction: (action) => {
                this.closeModal();
                if (action === 'restart') {
                    this.eventBus.emit('game:restart');
                } else {
                    this.eventBus.emit('game:quit');
                }
            }
        });
    }

    /**
     * Format duration in human readable format
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${seconds}s`;
    }

    /**
     * Open modal dialog
     * @param {Object} options - Modal options
     */
    openModal(options) {
        const { title, body, footer, onAction } = options;
        
        if (this.elements.modalTitle) {
            this.elements.modalTitle.textContent = title || '';
        }
        
        if (this.elements.modalBody) {
            this.elements.modalBody.innerHTML = body || '';
        }
        
        if (this.elements.modalFooter) {
            this.elements.modalFooter.innerHTML = footer || '';
            
            // Add action handlers
            if (onAction) {
                this.elements.modalFooter.querySelectorAll('[data-action]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        onAction(btn.dataset.action);
                    });
                });
            }
        }
        
        this.elements.modalContainer?.setAttribute('aria-hidden', 'false');
    }

    /**
     * Close modal dialog
     */
    closeModal() {
        this.elements.modalContainer?.setAttribute('aria-hidden', 'true');
    }

    /**
     * Show toast notification
     * @param {Object} options - Toast options
     */
    showToast(options) {
        const { type = 'info', title, message, duration = 3000 } = options;
        
        this.toastQueue.push({ type, title, message, duration });
        
        if (!this.isShowingToast) {
            this.processToastQueue();
        }
    }

    /**
     * Process toast queue
     */
    processToastQueue() {
        if (this.toastQueue.length === 0) {
            this.isShowingToast = false;
            return;
        }
        
        this.isShowingToast = true;
        const toast = this.toastQueue.shift();
        
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast toast--${toast.type}`;
        toastEl.innerHTML = `
            <span class="toast__icon">${icons[toast.type]}</span>
            <div class="toast__content">
                ${toast.title ? `<div class="toast__title">${toast.title}</div>` : ''}
                <div class="toast__message">${toast.message}</div>
            </div>
            <button class="toast__close">×</button>
        `;
        
        // Close button handler
        toastEl.querySelector('.toast__close').addEventListener('click', () => {
            this.removeToast(toastEl);
        });
        
        this.elements.toastContainer?.appendChild(toastEl);
        
        // Auto remove after duration
        setTimeout(() => {
            this.removeToast(toastEl);
        }, toast.duration);
    }

    /**
     * Remove toast element
     * @param {HTMLElement} toastEl - Toast element
     */
    removeToast(toastEl) {
        toastEl.classList.add('toast--exiting');
        
        setTimeout(() => {
            toastEl.remove();
            this.processToastQueue();
        }, 250);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showToast({
            type: 'error',
            title: 'Error',
            message
        });
    }

    /**
     * Show loading overlay
     * @param {string} [text] - Loading text
     */
    showLoading(text = 'Loading...') {
        if (this.elements.loadingOverlay) {
            const textEl = this.elements.loadingOverlay.querySelector('.loading-text');
            if (textEl) textEl.textContent = text;
            this.elements.loadingOverlay.setAttribute('aria-hidden', 'false');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.elements.loadingOverlay?.setAttribute('aria-hidden', 'true');
    }

    /**
     * Render feature importance bars
     * @param {Array} features - Feature importance data
     */
    renderFeatureImportance(features) {
        if (!this.elements.featureImportance) return;
        
        this.elements.featureImportance.innerHTML = features.map(f => `
            <div class="feature-bar">
                <span class="feature-bar__label">${f.name}</span>
                <div class="feature-bar__track">
                    <div class="feature-bar__fill" style="width: ${f.importance}%"></div>
                </div>
                <span class="feature-bar__value">${f.importance}%</span>
            </div>
        `).join('');
    }

    /**
     * Render session history
     * @param {Array} sessions - Session history
     */
    renderSessionHistory(sessions) {
        if (!this.elements.sessionHistory) return;
        
        if (sessions.length === 0) {
            this.elements.sessionHistory.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">📊</div>
                    <div class="empty-state__message">No sessions yet. Start playing!</div>
                </div>
            `;
            return;
        }
        
        const recentSessions = sessions.slice(-10).reverse();
        
        this.elements.sessionHistory.innerHTML = recentSessions.map(session => `
            <div class="card" style="padding: 1rem;">
                <div style="font-weight: 600;">${session.gameInfo?.name || 'Game'}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                    ${session.winner === 'draw' ? 'Draw' : `Player ${session.winner} won`}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                    ${new Date(session.timestamp).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    }

    /**
     * Get canvas context for game rendering
     * @returns {CanvasRenderingContext2D} Canvas context
     */
    getCanvasContext() {
        return this.elements.gameCanvas?.getContext('2d');
    }

    /**
     * Get game board element
     * @returns {HTMLElement} Game board element
     */
    getGameBoard() {
        return this.elements.gameBoard;
    }
}
