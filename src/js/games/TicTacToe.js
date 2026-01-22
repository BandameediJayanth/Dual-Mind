/**
 * TicTacToe - Classic 3x3 Grid Game
 * First player to get three in a row wins
 */

import { BaseGame } from './BaseGame.js';

export class TicTacToe extends BaseGame {
    constructor(eventBus) {
        super(eventBus);
        this.size = 3;
        this.winningCombinations = [
            // Rows
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            // Columns
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            // Diagonals
            [0, 4, 8],
            [2, 4, 6]
        ];
    }

    /**
     * Create initial game state
     * @returns {Object} Initial state
     */
    createInitialState() {
        return {
            board: Array(9).fill(null),
            winner: null,
            winningLine: null
        };
    }

    /**
     * Validate a move
     * @param {Object} moveData - { position: 0-8, player: 1|2 }
     * @returns {Object} Validation result
     */
    validateMove(moveData) {
        const { position } = moveData;

        // Check position is valid
        if (position < 0 || position > 8) {
            return { valid: false, reason: 'Invalid position' };
        }

        // Check cell is empty
        if (this.state.board[position] !== null) {
            return { valid: false, reason: 'Cell already occupied' };
        }

        return { valid: true };
    }

    /**
     * Apply a move to the state
     * @param {Object} moveData - Move data
     */
    applyMove(moveData) {
        const { position } = moveData;
        this.state.board[position] = this.currentPlayer;
    }

    /**
     * Check if game is over
     * @returns {Object} { gameOver, winner, reason, winningLine }
     */
    checkGameOver() {
        // Check for winner
        for (const combo of this.winningCombinations) {
            const [a, b, c] = combo;
            if (
                this.state.board[a] !== null &&
                this.state.board[a] === this.state.board[b] &&
                this.state.board[a] === this.state.board[c]
            ) {
                this.state.winner = this.state.board[a];
                this.state.winningLine = combo;
                return {
                    gameOver: true,
                    winner: this.state.board[a],
                    reason: 'Three in a row!',
                    winningLine: combo
                };
            }
        }

        // Check for draw
        if (!this.state.board.includes(null)) {
            return {
                gameOver: true,
                winner: 'draw',
                reason: 'Board is full'
            };
        }

        return { gameOver: false };
    }

    /**
     * Get valid moves for current state
     * @returns {Array} Array of valid positions
     */
    getValidMoves() {
        const validMoves = [];
        for (let i = 0; i < 9; i++) {
            if (this.state.board[i] === null) {
                validMoves.push({ position: i });
            }
        }
        return validMoves;
    }

    /**
     * Check if a move is optimal using minimax
     * @param {Object} moveData - Move data
     * @returns {boolean}
     */
    isOptimalMove(moveData) {
        const bestMoves = this.findBestMoves();
        return bestMoves.includes(moveData.position);
    }

    /**
     * Find the best moves using minimax
     * @returns {Array} Array of optimal positions
     */
    findBestMoves() {
        const validMoves = this.getValidMoves();
        if (validMoves.length === 0) return [];

        let bestScore = -Infinity;
        let bestMoves = [];

        for (const move of validMoves) {
            // Clone board and apply move
            const boardCopy = [...this.state.board];
            boardCopy[move.position] = this.currentPlayer;

            // Get score using minimax
            const score = this.minimax(boardCopy, 0, false);

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move.position];
            } else if (score === bestScore) {
                bestMoves.push(move.position);
            }
        }

        return bestMoves;
    }

    /**
     * Minimax algorithm
     * @param {Array} board - Board state
     * @param {number} depth - Current depth
     * @param {boolean} isMaximizing - Is maximizing player
     * @returns {number} Score
     */
    minimax(board, depth, isMaximizing) {
        const winner = this.checkWinnerForBoard(board);

        if (winner === this.currentPlayer) return 10 - depth;
        if (winner === (this.currentPlayer === 1 ? 2 : 1)) return depth - 10;
        if (!board.includes(null)) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = this.currentPlayer;
                    const score = this.minimax(board, depth + 1, false);
                    board[i] = null;
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            const opponent = this.currentPlayer === 1 ? 2 : 1;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = opponent;
                    const score = this.minimax(board, depth + 1, true);
                    board[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    /**
     * Check winner for a given board state
     * @param {Array} board - Board state
     * @returns {number|null} Winner (1 or 2) or null
     */
    checkWinnerForBoard(board) {
        for (const combo of this.winningCombinations) {
            const [a, b, c] = combo;
            if (
                board[a] !== null &&
                board[a] === board[b] &&
                board[a] === board[c]
            ) {
                return board[a];
            }
        }
        return null;
    }

    /**
     * Check if a move is a winning move
     * @param {Object} moveData - Move data
     * @returns {boolean}
     */
    isWinningMove(moveData) {
        const boardCopy = [...this.state.board];
        boardCopy[moveData.position] = this.currentPlayer;
        return this.checkWinnerForBoard(boardCopy) === this.currentPlayer;
    }

    /**
     * Check if a move is a blocking move
     * @param {Object} moveData - Move data
     * @returns {boolean}
     */
    isBlockingMove(moveData) {
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        const boardCopy = [...this.state.board];
        boardCopy[moveData.position] = opponent;
        return this.checkWinnerForBoard(boardCopy) === opponent;
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
        boardElement.style.display = 'grid';
        boardElement.className = 'tictactoe-board';
        
        boardElement.innerHTML = this.state.board.map((cell, index) => {
            const symbol = cell === 1 ? 'X' : cell === 2 ? 'O' : '';
            const playerClass = cell === 1 ? 'tictactoe-cell--x' : cell === 2 ? 'tictactoe-cell--o' : '';
            const takenClass = cell !== null ? 'tictactoe-cell--taken' : '';
            const winningClass = this.state.winningLine?.includes(index) ? 'tictactoe-cell--winning' : '';
            
            return `
                <div class="tictactoe-cell ${playerClass} ${takenClass} ${winningClass}" 
                     data-position="${index}"
                     role="button"
                     aria-label="Cell ${index + 1}${cell ? `, ${symbol}` : ', empty'}">
                    ${symbol}
                </div>
            `;
        }).join('');

        // Add click handlers
        boardElement.querySelectorAll('.tictactoe-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const position = parseInt(cell.dataset.position);
                if (this.state.board[position] === null) {
                    this.eventBus.emit('game:move', {
                        position,
                        player: this.currentPlayer,
                        isWinningMove: this.isWinningMove({ position }),
                        isBlockingMove: this.isBlockingMove({ position }),
                        isOptimal: this.isOptimalMove({ position })
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
        const cellSize = Math.min(width, height) / 3;
        const offsetX = (width - cellSize * 3) / 2;
        const offsetY = (height - cellSize * 3) / 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 4;

        // Vertical lines
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + i * cellSize, offsetY);
            ctx.lineTo(offsetX + i * cellSize, offsetY + cellSize * 3);
            ctx.stroke();
        }

        // Horizontal lines
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY + i * cellSize);
            ctx.lineTo(offsetX + cellSize * 3, offsetY + i * cellSize);
            ctx.stroke();
        }

        // Draw pieces
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const centerX = offsetX + col * cellSize + cellSize / 2;
            const centerY = offsetY + row * cellSize + cellSize / 2;
            const pieceSize = cellSize * 0.3;

            if (this.state.board[i] === 1) {
                // Draw X
                ctx.strokeStyle = '#4f46e5';
                ctx.beginPath();
                ctx.moveTo(centerX - pieceSize, centerY - pieceSize);
                ctx.lineTo(centerX + pieceSize, centerY + pieceSize);
                ctx.moveTo(centerX + pieceSize, centerY - pieceSize);
                ctx.lineTo(centerX - pieceSize, centerY + pieceSize);
                ctx.stroke();
            } else if (this.state.board[i] === 2) {
                // Draw O
                ctx.strokeStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(centerX, centerY, pieceSize, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Draw winning line
        if (this.state.winningLine) {
            const [a, , c] = this.state.winningLine;
            const startRow = Math.floor(a / 3);
            const startCol = a % 3;
            const endRow = Math.floor(c / 3);
            const endCol = c % 3;

            const startX = offsetX + startCol * cellSize + cellSize / 2;
            const startY = offsetY + startRow * cellSize + cellSize / 2;
            const endX = offsetX + endCol * cellSize + cellSize / 2;
            const endY = offsetY + endRow * cellSize + cellSize / 2;

            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    /**
     * Handle click input
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} canvasInfo - Canvas dimensions
     * @returns {Object|null} Move data
     */
    handleInput(x, y, canvasInfo = { width: 300, height: 300 }) {
        const cellSize = Math.min(canvasInfo.width, canvasInfo.height) / 3;
        const offsetX = (canvasInfo.width - cellSize * 3) / 2;
        const offsetY = (canvasInfo.height - cellSize * 3) / 2;

        const col = Math.floor((x - offsetX) / cellSize);
        const row = Math.floor((y - offsetY) / cellSize);

        if (col < 0 || col > 2 || row < 0 || row > 2) {
            return null;
        }

        const position = row * 3 + col;

        if (this.state.board[position] === null) {
            return {
                position,
                player: this.currentPlayer,
                isWinningMove: this.isWinningMove({ position }),
                isBlockingMove: this.isBlockingMove({ position }),
                isOptimal: this.isOptimalMove({ position })
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
            id: 'tictactoe',
            name: 'Tic Tac Toe',
            players: 2,
            description: 'Classic 3x3 grid game. Get three in a row to win!'
        };
    }
}
