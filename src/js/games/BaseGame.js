/**
 * BaseGame - Abstract Base Class for All Games
 * Provides common interface and functionality for game engines
 */

export class BaseGame {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.state = null;
        this.isInitialized = false;
        this.currentPlayer = 1;
        this.moveHistory = [];
        this.startTime = null;
    }

    /**
     * Initialize the game
     * Must be implemented by subclasses
     */
    async init() {
        this.state = this.createInitialState();
        this.currentPlayer = 1;
        this.moveHistory = [];
        this.startTime = Date.now();
        this.isInitialized = true;
    }

    /**
     * Create initial game state
     * Must be implemented by subclasses
     * @returns {Object} Initial state
     */
    createInitialState() {
        throw new Error('createInitialState must be implemented by subclass');
    }

    /**
     * Make a move
     * @param {Object} moveData - Move data
     * @returns {Object} Result with valid, gameOver, winner, etc.
     */
    makeMove(moveData) {
        if (!this.isInitialized) {
            return { valid: false, reason: 'Game not initialized' };
        }

        // Validate the move
        const validation = this.validateMove(moveData);
        if (!validation.valid) {
            return validation;
        }

        // Apply the move
        this.applyMove(moveData);

        // Record in history
        this.moveHistory.push({
            ...moveData,
            player: this.currentPlayer,
            timestamp: Date.now()
        });

        // Check for game over
        const gameOverCheck = this.checkGameOver();
        if (gameOverCheck.gameOver) {
            return {
                valid: true,
                gameOver: true,
                winner: gameOverCheck.winner,
                reason: gameOverCheck.reason
            };
        }

        // Check for extra turn (some games grant extra turns)
        const extraTurn = this.checkExtraTurn(moveData);

        // Switch player if no extra turn
        if (!extraTurn) {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        }

        return {
            valid: true,
            gameOver: false,
            extraTurn
        };
    }

    /**
     * Validate a move
     * Must be implemented by subclasses
     * @param {Object} moveData - Move data
     * @returns {Object} Validation result
     */
    validateMove(moveData) {
        throw new Error('validateMove must be implemented by subclass');
    }

    /**
     * Apply a move to the state
     * Must be implemented by subclasses
     * @param {Object} moveData - Move data
     */
    applyMove(moveData) {
        throw new Error('applyMove must be implemented by subclass');
    }

    /**
     * Check if game is over
     * Must be implemented by subclasses
     * @returns {Object} { gameOver, winner, reason }
     */
    checkGameOver() {
        throw new Error('checkGameOver must be implemented by subclass');
    }

    /**
     * Check if current player gets an extra turn
     * Can be overridden by subclasses for games with extra turn mechanics
     * @param {Object} moveData - Move data
     * @returns {boolean}
     */
    checkExtraTurn(moveData) {
        return false;
    }

    /**
     * Get current game state
     * @returns {Object} Current state
     */
    getState() {
        return {
            ...this.state,
            currentPlayer: this.currentPlayer,
            moveCount: this.moveHistory.length
        };
    }

    /**
     * Get valid moves for current state
     * Must be implemented by subclasses
     * @returns {Array} Array of valid moves
     */
    getValidMoves() {
        throw new Error('getValidMoves must be implemented by subclass');
    }

    /**
     * Get move history
     * @returns {Array} Move history
     */
    getMoveHistory() {
        return [...this.moveHistory];
    }

    /**
     * Undo the last move
     * Can be overridden by subclasses
     * @returns {boolean} Success
     */
    undoMove() {
        if (this.moveHistory.length === 0) {
            return false;
        }

        // Default implementation - requires state snapshots
        // Subclasses should implement proper undo logic
        console.warn('Undo not implemented for this game');
        return false;
    }

    /**
     * Serialize game state for saving/replay
     * @returns {Object} Serialized state
     */
    serialize() {
        return {
            state: this.state,
            currentPlayer: this.currentPlayer,
            moveHistory: this.moveHistory,
            startTime: this.startTime
        };
    }

    /**
     * Deserialize and restore game state
     * @param {Object} data - Serialized data
     */
    deserialize(data) {
        this.state = data.state;
        this.currentPlayer = data.currentPlayer;
        this.moveHistory = data.moveHistory;
        this.startTime = data.startTime;
        this.isInitialized = true;
    }

    /**
     * Cleanup when game ends
     */
    cleanup() {
        this.isInitialized = false;
    }

    /**
     * Render the game (can be overridden for custom rendering)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLElement} boardElement - DOM board element
     */
    render(ctx, boardElement) {
        // Default: no-op, subclasses implement rendering
    }

    /**
     * Handle click/touch input
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} Move data or null
     */
    handleInput(x, y) {
        // Default: no-op, subclasses implement input handling
        return null;
    }

    /**
     * Get game metadata
     * @returns {Object} Game metadata
     */
    getMetadata() {
        return {
            name: 'Base Game',
            players: 2,
            description: 'Base game class'
        };
    }

    /**
     * Check if a move is optimal (for ML features)
     * Can be overridden by subclasses with AI analysis
     * @param {Object} moveData - Move data
     * @returns {boolean}
     */
    isOptimalMove(moveData) {
        return false;
    }

    /**
     * Check if a move is a winning move
     * @param {Object} moveData - Move data
     * @returns {boolean}
     */
    isWinningMove(moveData) {
        // Clone state, apply move, check for win
        return false;
    }

    /**
     * Check if a move is a blocking move
     * @param {Object} moveData - Move data
     * @returns {boolean}
     */
    isBlockingMove(moveData) {
        return false;
    }
}
