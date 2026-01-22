/**
 * GameController - Central Game Management System
 * Manages game sessions, turn order, and coordinates game engines
 */

import { TicTacToe } from '../games/TicTacToe.js';
import { Checkers } from '../games/Checkers.js';
import { FourInARow } from '../games/FourInARow.js';
import { DotsAndBoxes } from '../games/DotsAndBoxes.js';
import { MemoryMatch } from '../games/MemoryMatch.js';
import { WordChain } from '../games/WordChain.js';
import { Game24 } from '../games/Game24.js';
import { MiniSudoku } from '../games/MiniSudoku.js';
import { Ludo } from '../games/Ludo.js';
import { Reversi } from '../games/Reversi.js';

/**
 * Game metadata for all available games
 */
export const GAMES = {
    tictactoe: {
        id: 'tictactoe',
        name: 'Tic Tac Toe',
        icon: '⭕',
        category: 'Strategy',
        description: 'Classic 3x3 grid game. Get three in a row to win!',
        players: 2,
        difficulty: 'Easy',
        cognitiveSkills: ['Pattern Recognition', 'Strategic Thinking']
    },
    checkers: {
        id: 'checkers',
        name: 'Checkers',
        icon: '🔴',
        category: 'Strategy',
        description: 'Jump over opponent pieces to capture them.',
        players: 2,
        difficulty: 'Medium',
        cognitiveSkills: ['Planning', 'Tactical Thinking']
    },
    fourinrow: {
        id: 'fourinrow',
        name: 'Four in a Row',
        icon: '🟡',
        category: 'Strategy',
        description: 'Drop pieces to connect four in any direction.',
        players: 2,
        difficulty: 'Easy',
        cognitiveSkills: ['Pattern Recognition', 'Forward Planning']
    },
    dotsandboxes: {
        id: 'dotsandboxes',
        name: 'Dots & Boxes',
        icon: '📦',
        category: 'Strategy',
        description: 'Complete boxes by drawing lines between dots.',
        players: 2,
        difficulty: 'Easy',
        cognitiveSkills: ['Spatial Reasoning', 'Pattern Recognition']
    },
    memorymatch: {
        id: 'memorymatch',
        name: 'Memory Match',
        icon: '🃏',
        category: 'Memory',
        description: 'Find matching pairs of cards.',
        players: 2,
        difficulty: 'Easy',
        cognitiveSkills: ['Memory', 'Concentration']
    },
    wordchain: {
        id: 'wordchain',
        name: 'Word Chain',
        icon: '📝',
        category: 'Word',
        description: 'Create words starting with the last letter of previous word.',
        players: 2,
        difficulty: 'Medium',
        cognitiveSkills: ['Vocabulary', 'Quick Thinking']
    },
    game24: {
        id: 'game24',
        name: '24 Game',
        icon: '🔢',
        category: 'Math',
        description: 'Use four numbers and operators to make 24.',
        players: 2,
        difficulty: 'Hard',
        cognitiveSkills: ['Arithmetic', 'Problem Solving']
    },
    minisudoku: {
        id: 'minisudoku',
        name: 'Mini Sudoku',
        icon: '🧩',
        category: 'Logic',
        description: 'Fill the 4x4 grid with numbers 1-4.',
        players: 1,
        difficulty: 'Medium',
        cognitiveSkills: ['Logic', 'Deduction']
    },
    ludo: {
        id: 'ludo',
        name: 'Ludo',
        icon: '🎲',
        category: 'Board',
        description: 'Race your pieces around the board to home.',
        players: 2,
        difficulty: 'Easy',
        cognitiveSkills: ['Risk Assessment', 'Adaptability']
    },
    reversi: {
        id: 'reversi',
        name: 'Reversi',
        icon: '⚫',
        category: 'Strategy',
        description: 'Flip opponent pieces to your color.',
        players: 2,
        difficulty: 'Medium',
        cognitiveSkills: ['Strategic Thinking', 'Planning']
    }
};

export class GameController {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentGame = null;
        this.currentGameId = null;
        this.currentPlayer = 1;
        this.gameState = null;
        this.moveHistory = [];
        this.sessionStartTime = null;
        this.isGameActive = false;
        
        // Game engine instances
        this.gameEngines = {};
    }

    /**
     * Initialize the game controller
     */
    init() {
        // Initialize game engines
        this.gameEngines = {
            tictactoe: new TicTacToe(this.eventBus),
            checkers: new Checkers(this.eventBus),
            fourinrow: new FourInARow(this.eventBus),
            dotsandboxes: new DotsAndBoxes(this.eventBus),
            memorymatch: new MemoryMatch(this.eventBus),
            wordchain: new WordChain(this.eventBus),
            game24: new Game24(this.eventBus),
            minisudoku: new MiniSudoku(this.eventBus),
            ludo: new Ludo(this.eventBus),
            reversi: new Reversi(this.eventBus)
        };
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('🎮 Game Controller initialized');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.eventBus.on('game:move', (data) => this.handleMove(data));
        this.eventBus.on('game:stateUpdate', (state) => this.handleStateUpdate(state));
    }

    /**
     * Get list of all available games
     * @returns {Array} Game metadata array
     */
    getGameList() {
        return Object.values(GAMES);
    }

    /**
     * Get game metadata by ID
     * @param {string} gameId - Game identifier
     * @returns {Object} Game metadata
     */
    getGameInfo(gameId) {
        return GAMES[gameId];
    }

    /**
     * Start a new game
     * @param {string} gameId - Game identifier
     */
    async startGame(gameId) {
        if (!GAMES[gameId]) {
            throw new Error(`Unknown game: ${gameId}`);
        }
        
        // End any current game
        if (this.isGameActive) {
            this.endGame();
        }
        
        this.currentGameId = gameId;
        this.currentGame = this.gameEngines[gameId];
        this.currentPlayer = 1;
        this.moveHistory = [];
        this.sessionStartTime = Date.now();
        this.isGameActive = true;
        
        // Initialize the game
        await this.currentGame.init();
        
        // Get initial state
        this.gameState = this.currentGame.getState();
        
        // Emit game start event
        this.eventBus.emit('game:start', {
            gameId,
            gameInfo: GAMES[gameId],
            state: this.gameState,
            currentPlayer: this.currentPlayer
        });
        
        console.log(`🎮 Started game: ${GAMES[gameId].name}`);
    }

    /**
     * Process a game move
     * @param {Object} moveData - Move data
     */
    processMove(moveData) {
        if (!this.isGameActive || !this.currentGame) {
            return;
        }
        
        // Validate it's the correct player's turn
        if (moveData.player !== this.currentPlayer) {
            console.warn('Not your turn!');
            return;
        }
        
        // Validate and apply the move
        const result = this.currentGame.makeMove(moveData);
        
        if (result.valid) {
            // Record move in history
            this.moveHistory.push({
                ...moveData,
                timestamp: Date.now(),
                player: this.currentPlayer
            });
            
            // Update game state
            this.gameState = this.currentGame.getState();
            
            // Check for game end
            if (result.gameOver) {
                this.handleGameOver(result);
            } else {
                // Switch player (unless special rules apply)
                if (!result.extraTurn) {
                    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                }
                
                // Emit turn change
                this.eventBus.emit('game:turnChange', {
                    currentPlayer: this.currentPlayer,
                    state: this.gameState
                });
            }
            
            // Emit state update
            this.eventBus.emit('game:stateUpdate', this.gameState);
        } else {
            // Invalid move
            this.eventBus.emit('game:invalidMove', {
                reason: result.reason
            });
        }
    }

    /**
     * Handle incoming move
     * @param {Object} data - Move data
     */
    handleMove(data) {
        this.processMove(data);
    }

    /**
     * Handle state update
     * @param {Object} state - New state
     */
    handleStateUpdate(state) {
        this.gameState = state;
    }

    /**
     * Handle game over
     * @param {Object} result - Game result
     */
    handleGameOver(result) {
        const sessionDuration = Date.now() - this.sessionStartTime;
        
        const gameResult = {
            gameId: this.currentGameId,
            gameInfo: GAMES[this.currentGameId],
            winner: result.winner,
            winReason: result.reason,
            finalState: this.gameState,
            moveHistory: this.moveHistory,
            moveCount: this.moveHistory.length,
            sessionDuration,
            timestamp: Date.now()
        };
        
        this.isGameActive = false;
        
        // Emit game end event
        this.eventBus.emit('game:end', gameResult);
        
        console.log(`🏆 Game over: ${result.winner ? `Player ${result.winner} wins!` : 'Draw!'}`);
    }

    /**
     * Restart the current game
     */
    restart() {
        if (this.currentGameId) {
            this.startGame(this.currentGameId);
        }
    }

    /**
     * End the current game
     */
    endGame() {
        if (this.currentGame) {
            this.currentGame.cleanup();
        }
        
        this.currentGame = null;
        this.currentGameId = null;
        this.gameState = null;
        this.isGameActive = false;
        
        console.log('🎮 Game ended');
    }

    /**
     * Get current game state
     * @returns {Object} Current game state
     */
    getState() {
        return this.gameState;
    }

    /**
     * Get move history
     * @returns {Array} Move history
     */
    getMoveHistory() {
        return [...this.moveHistory];
    }

    /**
     * Get current player
     * @returns {number} Current player (1 or 2)
     */
    getCurrentPlayer() {
        return this.currentPlayer;
    }

    /**
     * Check if game is active
     * @returns {boolean}
     */
    isActive() {
        return this.isGameActive;
    }

    /**
     * Get valid moves for current state
     * @returns {Array} Valid moves
     */
    getValidMoves() {
        if (this.currentGame && this.isGameActive) {
            return this.currentGame.getValidMoves();
        }
        return [];
    }
}
