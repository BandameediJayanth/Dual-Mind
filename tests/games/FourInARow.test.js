/**
 * FourInARow Game Engine Tests
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock BaseGame
class MockBaseGame {
    constructor() {
        this.state = 'idle';
        this.currentPlayer = 1;
        this.winner = null;
    }
}

// Simplified FourInARow for testing
class FourInARow extends MockBaseGame {
    constructor() {
        super();
        this.metadata = {
            id: 'four-in-a-row',
            name: 'Four in a Row',
            minPlayers: 2,
            maxPlayers: 2
        };
        this.rows = 6;
        this.cols = 7;
        this.board = null;
        this.moveCount = 0;
    }
    
    init() {
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.currentPlayer = 1;
        this.winner = null;
        this.state = 'playing';
        this.moveCount = 0;
        return true;
    }
    
    validateMove(move) {
        if (!move || typeof move.col !== 'number') return false;
        if (move.col < 0 || move.col >= this.cols) return false;
        // Check if column is full
        return this.board[0][move.col] === 0;
    }
    
    makeMove(move) {
        if (!this.validateMove(move)) {
            return { success: false, reason: 'Invalid move' };
        }
        
        // Find lowest empty row in column
        let row = -1;
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r][move.col] === 0) {
                row = r;
                break;
            }
        }
        
        this.board[row][move.col] = this.currentPlayer;
        this.moveCount++;
        
        const gameOver = this.checkGameOver(row, move.col);
        if (!gameOver) {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        }
        
        return { success: true, gameOver, winner: this.winner, row, col: move.col };
    }
    
    checkGameOver(lastRow, lastCol) {
        const player = this.board[lastRow][lastCol];
        
        // Check all four directions
        const directions = [
            [[0, 1], [0, -1]],   // Horizontal
            [[1, 0], [-1, 0]],   // Vertical
            [[1, 1], [-1, -1]], // Diagonal \
            [[1, -1], [-1, 1]]  // Diagonal /
        ];
        
        for (const [dir1, dir2] of directions) {
            let count = 1;
            
            // Check direction 1
            let r = lastRow + dir1[0];
            let c = lastCol + dir1[1];
            while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
                count++;
                r += dir1[0];
                c += dir1[1];
            }
            
            // Check direction 2
            r = lastRow + dir2[0];
            c = lastCol + dir2[1];
            while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
                count++;
                r += dir2[0];
                c += dir2[1];
            }
            
            if (count >= 4) {
                this.winner = player;
                this.state = 'ended';
                return true;
            }
        }
        
        // Check draw
        if (this.moveCount >= this.rows * this.cols) {
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
            state: this.state
        };
    }
}

describe('FourInARow', () => {
    let game;
    
    beforeEach(() => {
        game = new FourInARow();
        game.init();
    });
    
    describe('Initialization', () => {
        test('should initialize with empty 6x7 board', () => {
            const state = game.getState();
            expect(state.board.length).toBe(6);
            expect(state.board[0].length).toBe(7);
            expect(state.board.every(row => row.every(cell => cell === 0))).toBe(true);
        });
        
        test('should start with player 1', () => {
            expect(game.currentPlayer).toBe(1);
        });
        
        test('should be in playing state after init', () => {
            expect(game.state).toBe('playing');
        });
    });
    
    describe('Move Validation', () => {
        test('should accept valid column moves', () => {
            for (let col = 0; col < 7; col++) {
                expect(game.validateMove({ col })).toBe(true);
            }
        });
        
        test('should reject out of bounds columns', () => {
            expect(game.validateMove({ col: -1 })).toBe(false);
            expect(game.validateMove({ col: 7 })).toBe(false);
            expect(game.validateMove({ col: 10 })).toBe(false);
        });
        
        test('should reject full columns', () => {
            // Fill column 0
            for (let i = 0; i < 6; i++) {
                game.makeMove({ col: 0 });
                if (i < 5) game.makeMove({ col: 1 }); // Alternate to different column
            }
            // Column 0 should now be full
            // We need to check if there's a winner first
            game.init(); // Reset
            for (let i = 0; i < 6; i++) {
                game.makeMove({ col: 0 });
                game.makeMove({ col: 1 }); 
            }
            expect(game.validateMove({ col: 0 })).toBe(false);
        });
        
        test('should reject invalid move objects', () => {
            expect(game.validateMove(null)).toBe(false);
            expect(game.validateMove({})).toBe(false);
            expect(game.validateMove({ col: 'a' })).toBe(false);
        });
    });
    
    describe('Gravity Physics', () => {
        test('pieces should fall to bottom', () => {
            const result = game.makeMove({ col: 3 });
            expect(result.row).toBe(5); // Bottom row
            expect(game.board[5][3]).toBe(1);
        });
        
        test('pieces should stack on top of each other', () => {
            game.makeMove({ col: 3 }); // P1 at row 5
            game.makeMove({ col: 3 }); // P2 at row 4
            game.makeMove({ col: 3 }); // P1 at row 3
            
            expect(game.board[5][3]).toBe(1);
            expect(game.board[4][3]).toBe(2);
            expect(game.board[3][3]).toBe(1);
        });
    });
    
    describe('Win Detection', () => {
        test('should detect horizontal win', () => {
            // P1 places in columns 0,1,2,3
            // P2 places in row above
            game.makeMove({ col: 0 }); // P1
            game.makeMove({ col: 0 }); // P2
            game.makeMove({ col: 1 }); // P1
            game.makeMove({ col: 1 }); // P2
            game.makeMove({ col: 2 }); // P1
            game.makeMove({ col: 2 }); // P2
            const result = game.makeMove({ col: 3 }); // P1 wins
            
            expect(result.gameOver).toBe(true);
            expect(result.winner).toBe(1);
        });
        
        test('should detect vertical win', () => {
            // P1 stacks 4 in column 0
            game.makeMove({ col: 0 }); // P1
            game.makeMove({ col: 1 }); // P2
            game.makeMove({ col: 0 }); // P1
            game.makeMove({ col: 1 }); // P2
            game.makeMove({ col: 0 }); // P1
            game.makeMove({ col: 1 }); // P2
            const result = game.makeMove({ col: 0 }); // P1 wins
            
            expect(result.gameOver).toBe(true);
            expect(result.winner).toBe(1);
        });
        
        test('should detect diagonal win (bottom-left to top-right)', () => {
            // Build a diagonal for P1
            game.makeMove({ col: 0 }); // P1 row 5
            game.makeMove({ col: 1 }); // P2
            game.makeMove({ col: 1 }); // P1 row 4
            game.makeMove({ col: 2 }); // P2
            game.makeMove({ col: 2 }); // P1
            game.makeMove({ col: 3 }); // P2
            game.makeMove({ col: 2 }); // P1 row 3
            game.makeMove({ col: 3 }); // P2
            game.makeMove({ col: 3 }); // P1
            game.makeMove({ col: 4 }); // P2
            const result = game.makeMove({ col: 3 }); // P1 wins
            
            expect(result.gameOver).toBe(true);
            expect(result.winner).toBe(1);
        });
        
        test('should not detect win with less than 4 in a row', () => {
            game.makeMove({ col: 0 }); // P1
            game.makeMove({ col: 0 }); // P2
            game.makeMove({ col: 1 }); // P1
            game.makeMove({ col: 1 }); // P2
            const result = game.makeMove({ col: 2 }); // P1 - only 3 in a row
            
            expect(result.gameOver).toBe(false);
            expect(game.state).toBe('playing');
        });
    });
    
    describe('Player Alternation', () => {
        test('should alternate between players', () => {
            expect(game.currentPlayer).toBe(1);
            game.makeMove({ col: 0 });
            expect(game.currentPlayer).toBe(2);
            game.makeMove({ col: 1 });
            expect(game.currentPlayer).toBe(1);
        });
        
        test('should not alternate after game over', () => {
            // Quick vertical win
            game.makeMove({ col: 0 }); // P1
            game.makeMove({ col: 1 }); // P2
            game.makeMove({ col: 0 }); // P1
            game.makeMove({ col: 1 }); // P2
            game.makeMove({ col: 0 }); // P1
            game.makeMove({ col: 1 }); // P2
            game.makeMove({ col: 0 }); // P1 wins
            
            expect(game.currentPlayer).toBe(1); // Should stay at 1
        });
    });
});

describe('FourInARow Metadata', () => {
    test('should have correct game metadata', () => {
        const game = new FourInARow();
        expect(game.metadata.id).toBe('four-in-a-row');
        expect(game.metadata.name).toBe('Four in a Row');
        expect(game.metadata.minPlayers).toBe(2);
        expect(game.metadata.maxPlayers).toBe(2);
    });
});
