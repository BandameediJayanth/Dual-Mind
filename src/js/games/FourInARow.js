/**
 * FourInARow - Connect Four Game
 * Drop pieces to connect four in any direction
 */

import { BaseGame } from './BaseGame.js';

export class FourInARow extends BaseGame {
    constructor(eventBus) {
        super(eventBus);
        this.rows = 6;
        this.cols = 7;
    }

    /**
     * Create initial game state
     * @returns {Object} Initial state
     */
    createInitialState() {
        // Create empty 6x7 grid
        const board = [];
        for (let r = 0; r < this.rows; r++) {
            board.push(Array(this.cols).fill(null));
        }
        
        return {
            board,
            winner: null,
            winningCells: null,
            lastMove: null
        };
    }

    /**
     * Validate a move
     * @param {Object} moveData - { column: 0-6, player: 1|2 }
     * @returns {Object} Validation result
     */
    validateMove(moveData) {
        const { column } = moveData;

        // Check column is valid
        if (column < 0 || column >= this.cols) {
            return { valid: false, reason: 'Invalid column' };
        }

        // Check column has space
        if (this.state.board[0][column] !== null) {
            return { valid: false, reason: 'Column is full' };
        }

        return { valid: true };
    }

    /**
     * Apply a move to the state
     * @param {Object} moveData - Move data
     */
    applyMove(moveData) {
        const { column } = moveData;
        
        // Find the lowest empty row in this column
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.state.board[row][column] === null) {
                this.state.board[row][column] = this.currentPlayer;
                this.state.lastMove = { row, column };
                break;
            }
        }
    }

    /**
     * Check if game is over
     * @returns {Object} { gameOver, winner, reason, winningCells }
     */
    checkGameOver() {
        // Check for winner starting from last move
        if (this.state.lastMove) {
            const { row, column } = this.state.lastMove;
            const player = this.state.board[row][column];
            
            // Check all four directions
            const directions = [
                [[0, 1], [0, -1]],  // Horizontal
                [[1, 0], [-1, 0]],  // Vertical
                [[1, 1], [-1, -1]], // Diagonal /
                [[1, -1], [-1, 1]]  // Diagonal \
            ];
            
            for (const [dir1, dir2] of directions) {
                const cells = this.countDirection(row, column, player, dir1, dir2);
                if (cells.length >= 4) {
                    this.state.winner = player;
                    this.state.winningCells = cells;
                    return {
                        gameOver: true,
                        winner: player,
                        reason: 'Four in a row!',
                        winningCells: cells
                    };
                }
            }
        }

        // Check for draw
        if (this.state.board[0].every(cell => cell !== null)) {
            return {
                gameOver: true,
                winner: 'draw',
                reason: 'Board is full'
            };
        }

        return { gameOver: false };
    }

    /**
     * Count connected pieces in a direction
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} player - Player to check
     * @param {Array} dir1 - First direction [rowDelta, colDelta]
     * @param {Array} dir2 - Second direction [rowDelta, colDelta]
     * @returns {Array} Array of connected cells
     */
    countDirection(row, col, player, dir1, dir2) {
        const cells = [[row, col]];
        
        // Check direction 1
        let r = row + dir1[0];
        let c = col + dir1[1];
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && 
               this.state.board[r][c] === player) {
            cells.push([r, c]);
            r += dir1[0];
            c += dir1[1];
        }
        
        // Check direction 2
        r = row + dir2[0];
        c = col + dir2[1];
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && 
               this.state.board[r][c] === player) {
            cells.push([r, c]);
            r += dir2[0];
            c += dir2[1];
        }
        
        return cells;
    }

    /**
     * Get valid moves for current state
     * @returns {Array} Array of valid columns
     */
    getValidMoves() {
        const validMoves = [];
        for (let col = 0; col < this.cols; col++) {
            if (this.state.board[0][col] === null) {
                validMoves.push({ column: col });
            }
        }
        return validMoves;
    }

    /**
     * Check if a move is a winning move
     * @param {Object} moveData - Move data
     * @returns {boolean}
     */
    isWinningMove(moveData) {
        const { column } = moveData;
        
        // Find where piece would land
        let landingRow = -1;
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.state.board[row][column] === null) {
                landingRow = row;
                break;
            }
        }
        
        if (landingRow === -1) return false;
        
        // Temporarily place piece
        this.state.board[landingRow][column] = this.currentPlayer;
        
        // Check for win
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];
        
        let isWin = false;
        for (const [dir1, dir2] of directions) {
            const cells = this.countDirection(landingRow, column, this.currentPlayer, dir1, dir2);
            if (cells.length >= 4) {
                isWin = true;
                break;
            }
        }
        
        // Remove piece
        this.state.board[landingRow][column] = null;
        
        return isWin;
    }

    /**
     * Check if a move is a blocking move
     * @param {Object} moveData - Move data
     * @returns {boolean}
     */
    isBlockingMove(moveData) {
        const { column } = moveData;
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        
        // Find where piece would land
        let landingRow = -1;
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.state.board[row][column] === null) {
                landingRow = row;
                break;
            }
        }
        
        if (landingRow === -1) return false;
        
        // Check if opponent would win here
        this.state.board[landingRow][column] = opponent;
        
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];
        
        let wouldWin = false;
        for (const [dir1, dir2] of directions) {
            const cells = this.countDirection(landingRow, column, opponent, dir1, dir2);
            if (cells.length >= 4) {
                wouldWin = true;
                break;
            }
        }
        
        // Remove piece
        this.state.board[landingRow][column] = null;
        
        return wouldWin;
    }

    /**
     * Render the game board
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLElement} boardElement - DOM board element
     */
    render(ctx, boardElement) {
        if (boardElement) {
            this.renderDOM(boardElement);
        } else if (ctx) {
            this.renderCanvas(ctx);
        }
    }

    /**
     * Render using DOM
     * @param {HTMLElement} boardElement - Board element
     */
    renderDOM(boardElement) {
        boardElement.style.display = 'block';
        boardElement.className = 'connect4-container';
        
        let html = '<div class="connect4-board">';
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.state.board[row][col];
                const isWinning = this.state.winningCells?.some(([r, c]) => r === row && c === col);
                
                html += `
                    <div class="connect4-cell" data-row="${row}" data-col="${col}">
                        ${cell !== null ? `
                            <div class="connect4-piece connect4-piece--${cell === 1 ? 'red' : 'yellow'} ${isWinning ? 'connect4-piece--winning' : ''}"></div>
                        ` : ''}
                    </div>
                `;
            }
        }
        
        html += '</div>';
        
        // Column indicators
        html += '<div class="connect4-column-indicator">';
        for (let col = 0; col < this.cols; col++) {
            const isValid = this.state.board[0][col] === null;
            html += `<span class="connect4-arrow ${isValid ? '' : 'hidden'}" data-col="${col}">▼</span>`;
        }
        html += '</div>';
        
        boardElement.innerHTML = html;

        // Add click handlers
        boardElement.querySelectorAll('.connect4-cell, .connect4-arrow').forEach(el => {
            el.addEventListener('click', () => {
                const col = parseInt(el.dataset.col);
                if (!isNaN(col) && this.state.board[0][col] === null) {
                    this.eventBus.emit('game:move', {
                        column: col,
                        player: this.currentPlayer,
                        isWinningMove: this.isWinningMove({ column: col }),
                        isBlockingMove: this.isBlockingMove({ column: col })
                    });
                }
            });
        });
    }

    /**
     * Render using Canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderCanvas(ctx) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const cellSize = Math.min(width / this.cols, height / this.rows) * 0.9;
        const offsetX = (width - cellSize * this.cols) / 2;
        const offsetY = (height - cellSize * this.rows) / 2;
        const pieceRadius = cellSize * 0.4;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw board background
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.roundRect(offsetX - 10, offsetY - 10, cellSize * this.cols + 20, cellSize * this.rows + 20, 10);
        ctx.fill();

        // Draw cells and pieces
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const centerX = offsetX + col * cellSize + cellSize / 2;
                const centerY = offsetY + row * cellSize + cellSize / 2;
                const cell = this.state.board[row][col];
                const isWinning = this.state.winningCells?.some(([r, c]) => r === row && c === col);

                // Draw hole
                ctx.fillStyle = '#1e40af';
                ctx.beginPath();
                ctx.arc(centerX, centerY, pieceRadius + 2, 0, Math.PI * 2);
                ctx.fill();

                // Draw piece or empty hole
                if (cell === null) {
                    ctx.fillStyle = '#f9fafb';
                } else if (cell === 1) {
                    ctx.fillStyle = isWinning ? '#10b981' : '#dc2626';
                } else {
                    ctx.fillStyle = isWinning ? '#10b981' : '#eab308';
                }

                ctx.beginPath();
                ctx.arc(centerX, centerY, pieceRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Handle click input
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} canvasInfo - Canvas dimensions
     * @returns {Object|null} Move data
     */
    handleInput(x, y, canvasInfo = { width: 600, height: 600 }) {
        const cellSize = Math.min(canvasInfo.width / this.cols, canvasInfo.height / this.rows) * 0.9;
        const offsetX = (canvasInfo.width - cellSize * this.cols) / 2;

        const col = Math.floor((x - offsetX) / cellSize);

        if (col >= 0 && col < this.cols && this.state.board[0][col] === null) {
            return {
                column: col,
                player: this.currentPlayer,
                isWinningMove: this.isWinningMove({ column: col }),
                isBlockingMove: this.isBlockingMove({ column: col })
            };
        }

        return null;
    }

    /**
     * Get game metadata
     * @returns {Object} Game metadata
     */
    getMetadata() {
        return {
            id: 'fourinrow',
            name: 'Four in a Row',
            players: 2,
            description: 'Drop pieces to connect four in any direction.'
        };
    }
}
