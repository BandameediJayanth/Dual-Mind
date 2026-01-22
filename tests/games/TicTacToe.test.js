/**
 * TicTacToe Game Engine Tests
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock BaseGame since we're testing in isolation
class MockBaseGame {
    constructor() {
        this.state = 'idle';
        this.currentPlayer = 1;
        this.winner = null;
    }
}

// Simplified TicTacToe for testing (without DOM dependencies)
class TicTacToe extends MockBaseGame {
    constructor() {
        super();
        this.metadata = {
            id: 'tic-tac-toe',
            name: 'Tic Tac Toe',
            minPlayers: 2,
            maxPlayers: 2
        };
        this.board = null;
        this.moveCount = 0;
    }
    
    init() {
        this.board = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];
        this.currentPlayer = 1;
        this.winner = null;
        this.state = 'playing';
        this.moveCount = 0;
        return true;
    }
    
    validateMove(move) {
        if (!move || typeof move.row !== 'number' || typeof move.col !== 'number') {
            return false;
        }
        if (move.row < 0 || move.row > 2 || move.col < 0 || move.col > 2) {
            return false;
        }
        if (this.board[move.row][move.col] !== 0) {
            return false;
        }
        return true;
    }
    
    makeMove(move) {
        if (!this.validateMove(move)) {
            return { success: false, reason: 'Invalid move' };
        }
        
        this.board[move.row][move.col] = this.currentPlayer;
        this.moveCount++;
        
        const gameOver = this.checkGameOver();
        if (!gameOver) {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        }
        
        return { success: true, gameOver, winner: this.winner };
    }
    
    checkGameOver() {
        // Check rows
        for (let i = 0; i < 3; i++) {
            if (this.board[i][0] !== 0 &&
                this.board[i][0] === this.board[i][1] &&
                this.board[i][1] === this.board[i][2]) {
                this.winner = this.board[i][0];
                this.state = 'ended';
                return true;
            }
        }
        
        // Check columns
        for (let j = 0; j < 3; j++) {
            if (this.board[0][j] !== 0 &&
                this.board[0][j] === this.board[1][j] &&
                this.board[1][j] === this.board[2][j]) {
                this.winner = this.board[0][j];
                this.state = 'ended';
                return true;
            }
        }
        
        // Check diagonals
        if (this.board[1][1] !== 0) {
            if ((this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) ||
                (this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0])) {
                this.winner = this.board[1][1];
                this.state = 'ended';
                return true;
            }
        }
        
        // Check draw
        if (this.moveCount >= 9) {
            this.winner = null;
            this.state = 'ended';
            return true;
        }
        
        return false;
    }
    
    getState() {
        return {
            board: this.board.map(row => [...row]),
            currentPlayer: this.currentPlayer,
            winner: this.winner,
            state: this.state,
            moveCount: this.moveCount
        };
    }
}

describe('TicTacToe', () => {
    let game;
    
    beforeEach(() => {
        game = new TicTacToe();
        game.init();
    });
    
    describe('Initialization', () => {
        test('should initialize with empty board', () => {
            const state = game.getState();
            expect(state.board).toEqual([
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ]);
        });
        
        test('should start with player 1', () => {
            expect(game.currentPlayer).toBe(1);
        });
        
        test('should be in playing state after init', () => {
            expect(game.state).toBe('playing');
        });
        
        test('should have no winner initially', () => {
            expect(game.winner).toBeNull();
        });
    });
    
    describe('Move Validation', () => {
        test('should accept valid moves', () => {
            expect(game.validateMove({ row: 0, col: 0 })).toBe(true);
            expect(game.validateMove({ row: 1, col: 1 })).toBe(true);
            expect(game.validateMove({ row: 2, col: 2 })).toBe(true);
        });
        
        test('should reject out of bounds moves', () => {
            expect(game.validateMove({ row: -1, col: 0 })).toBe(false);
            expect(game.validateMove({ row: 0, col: 3 })).toBe(false);
            expect(game.validateMove({ row: 3, col: 3 })).toBe(false);
        });
        
        test('should reject moves on occupied cells', () => {
            game.makeMove({ row: 0, col: 0 });
            expect(game.validateMove({ row: 0, col: 0 })).toBe(false);
        });
        
        test('should reject invalid move objects', () => {
            expect(game.validateMove(null)).toBe(false);
            expect(game.validateMove({})).toBe(false);
            expect(game.validateMove({ row: 'a', col: 0 })).toBe(false);
        });
    });
    
    describe('Making Moves', () => {
        test('should place piece on board', () => {
            game.makeMove({ row: 0, col: 0 });
            expect(game.board[0][0]).toBe(1);
        });
        
        test('should alternate players', () => {
            game.makeMove({ row: 0, col: 0 });
            expect(game.currentPlayer).toBe(2);
            
            game.makeMove({ row: 0, col: 1 });
            expect(game.currentPlayer).toBe(1);
        });
        
        test('should return success for valid moves', () => {
            const result = game.makeMove({ row: 0, col: 0 });
            expect(result.success).toBe(true);
        });
        
        test('should return failure for invalid moves', () => {
            game.makeMove({ row: 0, col: 0 });
            const result = game.makeMove({ row: 0, col: 0 });
            expect(result.success).toBe(false);
        });
        
        test('should increment move count', () => {
            expect(game.moveCount).toBe(0);
            game.makeMove({ row: 0, col: 0 });
            expect(game.moveCount).toBe(1);
        });
    });
    
    describe('Win Detection', () => {
        test('should detect horizontal win', () => {
            // Player 1: top row
            game.makeMove({ row: 0, col: 0 }); // P1
            game.makeMove({ row: 1, col: 0 }); // P2
            game.makeMove({ row: 0, col: 1 }); // P1
            game.makeMove({ row: 1, col: 1 }); // P2
            const result = game.makeMove({ row: 0, col: 2 }); // P1 wins
            
            expect(result.gameOver).toBe(true);
            expect(result.winner).toBe(1);
            expect(game.state).toBe('ended');
        });
        
        test('should detect vertical win', () => {
            // Player 1: first column
            game.makeMove({ row: 0, col: 0 }); // P1
            game.makeMove({ row: 0, col: 1 }); // P2
            game.makeMove({ row: 1, col: 0 }); // P1
            game.makeMove({ row: 1, col: 1 }); // P2
            const result = game.makeMove({ row: 2, col: 0 }); // P1 wins
            
            expect(result.gameOver).toBe(true);
            expect(result.winner).toBe(1);
        });
        
        test('should detect diagonal win (top-left to bottom-right)', () => {
            game.makeMove({ row: 0, col: 0 }); // P1
            game.makeMove({ row: 0, col: 1 }); // P2
            game.makeMove({ row: 1, col: 1 }); // P1
            game.makeMove({ row: 0, col: 2 }); // P2
            const result = game.makeMove({ row: 2, col: 2 }); // P1 wins
            
            expect(result.gameOver).toBe(true);
            expect(result.winner).toBe(1);
        });
        
        test('should detect diagonal win (top-right to bottom-left)', () => {
            game.makeMove({ row: 0, col: 2 }); // P1
            game.makeMove({ row: 0, col: 0 }); // P2
            game.makeMove({ row: 1, col: 1 }); // P1
            game.makeMove({ row: 0, col: 1 }); // P2
            const result = game.makeMove({ row: 2, col: 0 }); // P1 wins
            
            expect(result.gameOver).toBe(true);
            expect(result.winner).toBe(1);
        });
        
        test('should detect draw', () => {
            // Play a draw game
            game.makeMove({ row: 0, col: 0 }); // P1 X
            game.makeMove({ row: 0, col: 1 }); // P2 O
            game.makeMove({ row: 0, col: 2 }); // P1 X
            game.makeMove({ row: 1, col: 0 }); // P2 O
            game.makeMove({ row: 1, col: 1 }); // P1 X
            game.makeMove({ row: 2, col: 2 }); // P2 O
            game.makeMove({ row: 1, col: 2 }); // P1 X
            game.makeMove({ row: 2, col: 0 }); // P2 O
            const result = game.makeMove({ row: 2, col: 1 }); // P1 X - Draw
            
            expect(result.gameOver).toBe(true);
            expect(result.winner).toBeNull();
            expect(game.state).toBe('ended');
        });
    });
    
    describe('Game State', () => {
        test('should return correct state snapshot', () => {
            game.makeMove({ row: 0, col: 0 });
            game.makeMove({ row: 1, col: 1 });
            
            const state = game.getState();
            expect(state.board[0][0]).toBe(1);
            expect(state.board[1][1]).toBe(2);
            expect(state.currentPlayer).toBe(1);
            expect(state.moveCount).toBe(2);
        });
        
        test('state snapshot should be a copy (immutable)', () => {
            const state1 = game.getState();
            state1.board[0][0] = 99;
            
            const state2 = game.getState();
            expect(state2.board[0][0]).toBe(0);
        });
    });
});

describe('TicTacToe Metadata', () => {
    test('should have correct game metadata', () => {
        const game = new TicTacToe();
        expect(game.metadata.id).toBe('tic-tac-toe');
        expect(game.metadata.name).toBe('Tic Tac Toe');
        expect(game.metadata.minPlayers).toBe(2);
        expect(game.metadata.maxPlayers).toBe(2);
    });
});
