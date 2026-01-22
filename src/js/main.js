/**
 * Main Application Entry Point
 * Unified Browser-Based Multiplayer Game Suite with ML-Driven IQ Monitoring
 */

import { EventBus } from './core/EventBus.js';
import { GameController } from './core/GameController.js';
import { UIManager } from './ui/UIManager.js';
import { StorageManager } from './storage/StorageManager.js';
import { AnalyticsEngine } from './analytics/AnalyticsEngine.js';
import { FeatureExtractor } from './ml/FeatureExtractor.js';
import { MLInference } from './ml/MLInference.js';

/**
 * Main Application Class
 * Initializes and coordinates all system components
 */
class GameSuiteApp {
    constructor() {
        // Core systems
        this.eventBus = new EventBus();
        this.storage = new StorageManager();
        this.uiManager = new UIManager(this.eventBus);
        this.gameController = new GameController(this.eventBus);
        
        // Analytics and ML systems
        this.featureExtractor = new FeatureExtractor(this.eventBus);
        this.mlInference = new MLInference();
        this.analyticsEngine = new AnalyticsEngine(this.eventBus, this.storage);
        
        // Application state
        this.currentView = 'home';
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🎮 Initializing Game Suite...');
            
            // Load user settings
            await this.loadSettings();
            
            // Initialize UI
            this.uiManager.init();
            
            // Initialize game controller
            this.gameController.init();
            
            // Initialize analytics
            await this.analyticsEngine.init();
            
            // Initialize ML inference engine
            await this.mlInference.init();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load user data
            await this.loadUserData();
            
            this.isInitialized = true;
            console.log('✅ Game Suite initialized successfully!');
            
            // Emit ready event
            this.eventBus.emit('app:ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Game Suite:', error);
            this.uiManager.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Load user settings from storage
     */
    async loadSettings() {
        const settings = await this.storage.get('settings');
        
        if (settings) {
            this.applySettings(settings);
        } else {
            // Apply default settings
            this.applySettings({
                darkMode: false,
                animations: true,
                sound: true,
                highContrast: false,
                largeText: false,
                iqMonitoring: true,
                storeData: true
            });
        }
    }

    /**
     * Apply settings to the application
     * @param {Object} settings - Settings object
     */
    applySettings(settings) {
        const root = document.documentElement;
        
        // Apply theme
        if (settings.darkMode) {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
        
        // Apply accessibility settings
        if (settings.highContrast) {
            root.setAttribute('data-contrast', 'high');
        } else {
            root.removeAttribute('data-contrast');
        }
        
        if (settings.largeText) {
            root.setAttribute('data-large-text', 'true');
        } else {
            root.removeAttribute('data-large-text');
        }
        
        // Store settings reference
        this.settings = settings;
        
        // Update UI toggles
        this.uiManager.updateSettingsUI(settings);
    }

    /**
     * Load user data from storage
     */
    async loadUserData() {
        try {
            // Load gameplay statistics
            const stats = await this.storage.get('stats');
            if (stats) {
                this.uiManager.updateQuickStats(stats);
            }
            
            // Load IQ trends
            const iqTrends = await this.storage.get('iqTrends');
            if (iqTrends) {
                this.analyticsEngine.loadTrends(iqTrends);
            }
            
            // Load session history
            const sessions = await this.storage.get('sessions');
            if (sessions) {
                this.analyticsEngine.loadSessions(sessions);
            }
            
        } catch (error) {
            console.warn('Failed to load user data:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Navigation events
        this.eventBus.on('navigate', (view) => this.navigateTo(view));
        
        // Game events
        this.eventBus.on('game:select', (gameId) => this.startGame(gameId));
        this.eventBus.on('game:move', (data) => this.handleGameMove(data));
        this.eventBus.on('game:end', (result) => this.handleGameEnd(result));
        this.eventBus.on('game:restart', () => this.restartGame());
        this.eventBus.on('game:quit', () => this.quitGame());
        
        // Settings events
        this.eventBus.on('settings:change', (data) => this.handleSettingsChange(data));
        this.eventBus.on('settings:clearData', () => this.clearAllData());
        this.eventBus.on('settings:exportData', () => this.exportData());
        
        // Analytics events
        this.eventBus.on('analytics:update', (data) => this.updateAnalytics(data));
        
        // DOM event listeners
        this.setupDOMListeners();
    }

    /**
     * Set up DOM event listeners
     */
    setupDOMListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view) {
                    this.eventBus.emit('navigate', view);
                }
            });
        });
        
        // Start playing button
        const startBtn = document.querySelector('[data-action="start-playing"]');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.eventBus.emit('navigate', 'games');
            });
        }
        
        // Game control buttons
        document.getElementById('btn-restart')?.addEventListener('click', () => {
            this.eventBus.emit('game:restart');
        });
        
        document.getElementById('btn-quit')?.addEventListener('click', () => {
            this.eventBus.emit('game:quit');
        });
        
        // Settings toggles
        this.setupSettingsListeners();
    }

    /**
     * Set up settings toggle listeners
     */
    setupSettingsListeners() {
        const settingsMap = {
            'setting-dark-mode': 'darkMode',
            'setting-animations': 'animations',
            'setting-sound': 'sound',
            'setting-contrast': 'highContrast',
            'setting-large-text': 'largeText',
            'setting-iq-monitoring': 'iqMonitoring',
            'setting-store-data': 'storeData'
        };
        
        Object.entries(settingsMap).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.eventBus.emit('settings:change', {
                        key,
                        value: element.checked
                    });
                });
            }
        });
        
        // Clear data button
        document.getElementById('btn-clear-data')?.addEventListener('click', () => {
            this.eventBus.emit('settings:clearData');
        });
        
        // Export data button
        document.getElementById('btn-export-data')?.addEventListener('click', () => {
            this.eventBus.emit('settings:exportData');
        });
    }

    /**
     * Navigate to a view
     * @param {string} view - View name
     */
    navigateTo(view) {
        // Update navigation active state
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Update view visibility
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('view--active');
        });
        
        const targetView = document.getElementById(`view-${view}`);
        if (targetView) {
            targetView.classList.add('view--active');
            this.currentView = view;
        }
        
        // Special handling for games view
        if (view === 'games') {
            this.uiManager.renderGameGrid();
        }
        
        // Special handling for analytics view
        if (view === 'analytics') {
            this.analyticsEngine.refreshDisplay();
        }
    }

    /**
     * Start a game
     * @param {string} gameId - Game identifier
     */
    async startGame(gameId) {
        try {
            // Navigate to gameplay view
            this.navigateTo('gameplay');
            
            // Initialize the game
            await this.gameController.startGame(gameId);
            
            // Start feature extraction
            this.featureExtractor.startSession(gameId);
            
            // Update UI
            this.uiManager.updateGameUI(gameId);
            
        } catch (error) {
            console.error('Failed to start game:', error);
            this.uiManager.showError('Failed to start game. Please try again.');
            this.navigateTo('games');
        }
    }

    /**
     * Handle a game move
     * @param {Object} data - Move data
     */
    handleGameMove(data) {
        // Record move for feature extraction
        this.featureExtractor.recordMove(data);
        
        // Process move in game controller
        this.gameController.processMove(data);
    }

    /**
     * Handle game end
     * @param {Object} result - Game result
     */
    async handleGameEnd(result) {
        // Extract features from the session
        const features = this.featureExtractor.extractFeatures();
        
        // Run ML inference if enabled
        if (this.settings.iqMonitoring) {
            const prediction = await this.mlInference.predict(features);
            result.mlPrediction = prediction;
            
            // Update analytics
            this.analyticsEngine.recordSession({
                ...result,
                features,
                prediction
            });
        }
        
        // Save session data if enabled
        if (this.settings.storeData) {
            await this.saveSession(result);
        }
        
        // Update statistics
        await this.updateStats(result);
        
        // Show game result
        this.uiManager.showGameResult(result);
    }

    /**
     * Restart the current game
     */
    restartGame() {
        const currentGame = this.gameController.currentGameId;
        if (currentGame) {
            this.gameController.restart();
            this.featureExtractor.startSession(currentGame);
        }
    }

    /**
     * Quit the current game
     */
    quitGame() {
        this.gameController.endGame();
        this.featureExtractor.endSession();
        this.navigateTo('games');
    }

    /**
     * Handle settings change
     * @param {Object} data - Settings change data
     */
    async handleSettingsChange(data) {
        const { key, value } = data;
        
        // Update settings
        this.settings[key] = value;
        
        // Apply settings
        this.applySettings(this.settings);
        
        // Save settings
        await this.storage.set('settings', this.settings);
        
        // Show confirmation
        this.uiManager.showToast({
            type: 'success',
            message: 'Settings updated'
        });
    }

    /**
     * Save session data
     * @param {Object} result - Session result
     */
    async saveSession(result) {
        try {
            const sessions = await this.storage.get('sessions') || [];
            sessions.push({
                ...result,
                timestamp: Date.now()
            });
            
            // Keep only last 100 sessions
            if (sessions.length > 100) {
                sessions.shift();
            }
            
            await this.storage.set('sessions', sessions);
        } catch (error) {
            console.warn('Failed to save session:', error);
        }
    }

    /**
     * Update user statistics
     * @param {Object} result - Game result
     */
    async updateStats(result) {
        try {
            const stats = await this.storage.get('stats') || {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0
            };
            
            stats.gamesPlayed++;
            
            if (result.winner === 'player1') {
                stats.wins++;
            } else if (result.winner === 'player2') {
                stats.losses++;
            } else {
                stats.draws++;
            }
            
            await this.storage.set('stats', stats);
            this.uiManager.updateQuickStats(stats);
            
        } catch (error) {
            console.warn('Failed to update stats:', error);
        }
    }

    /**
     * Update analytics display
     * @param {Object} data - Analytics data
     */
    updateAnalytics(data) {
        this.analyticsEngine.update(data);
    }

    /**
     * Clear all user data
     */
    async clearAllData() {
        const confirmed = confirm('Are you sure you want to clear all data? This cannot be undone.');
        
        if (confirmed) {
            await this.storage.clear();
            
            // Reset UI
            this.uiManager.updateQuickStats({
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0
            });
            
            this.analyticsEngine.reset();
            
            this.uiManager.showToast({
                type: 'success',
                message: 'All data cleared'
            });
        }
    }

    /**
     * Export user data
     */
    async exportData() {
        try {
            const data = await this.storage.exportAll();
            
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `game-suite-data-${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.uiManager.showToast({
                type: 'success',
                message: 'Data exported successfully'
            });
            
        } catch (error) {
            console.error('Failed to export data:', error);
            this.uiManager.showError('Failed to export data');
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new GameSuiteApp();
    app.init();
    
    // Expose app to window for debugging
    window.gameSuiteApp = app;
});

export { GameSuiteApp };
