/**
 * Reversi (Othello) - Classic Strategy Board Game
 * Flip opponent's pieces by sandwiching them
 */

import { BaseGame } from './BaseGame.js';

export class Reversi extends BaseGame {
    constructor(eventBus) {
        super(eventBus);
        this.size = 8;
    }

    createInitialState() {
        const board = [];
        for (let r = 0; r < this.size; r++) {
            board.push(Array(this.size).fill(null));
        }
        
        // Initial 4 pieces in center
        const mid = this.size / 2;
        board[mid - 1][mid - 1] = 2; // White
        board[mid - 1][mid] = 1;     // Black
        board[mid][mid - 1] = 1;     // Black
        board[mid][mid] = 2;         // White
        
        return {
            board,
            scores: { 1: 2, 2: 2 },
            validMoves: this.calculateValidMoves(board, 1),
            passCount: 0
        };
    }

    calculateValidMoves(board, player) {
        const moves = [];
        
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (board[r][c] === null) {
                    const flips = this.getFlipsForMove(board, r, c, player);
                    if (flips.length > 0) {
                        moves.push({ row: r, col: c, flips });
                    }
                }
            }
        }
        
        return moves;
    }

    getFlipsForMove(board, row, col, player) {
        if (board[row][col] !== null) return [];
        
        const opponent = player === 1 ? 2 : 1;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        const allFlips = [];
        
        for (const [dr, dc] of directions) {
            const flips = [];
            let r = row + dr;
            let c = col + dc;
            
            // Move in direction while finding opponent pieces
            while (r >= 0 && r < this.size && c >= 0 && c < this.size && 
                   board[r][c] === opponent) {
                flips.push({ row: r, col: c });
                r += dr;
                c += dc;
            }
            
            // Check if we ended on our own piece (valid sandwich)
            if (flips.length > 0 && 
                r >= 0 && r < this.size && c >= 0 && c < this.size && 
                board[r][c] === player) {
                allFlips.push(...flips);
            }
        }
        
        return allFlips;
    }

    validateMove(moveData) {
        const { row, col } = moveData;
        
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return { valid: false, reason: 'Out of bounds' };
        }
        
        if (this.state.board[row][col] !== null) {
            return { valid: false, reason: 'Cell is occupied' };
        }
        
        const validMove = this.state.validMoves.find(m => m.row === row && m.col === col);
        if (!validMove) {
            return { valid: false, reason: 'No pieces to flip in that position' };
        }
        
        return { valid: true, flips: validMove.flips };
    }

    applyMove(moveData) {
        const { row, col } = moveData;
        const validation = this.validateMove(moveData);
        
        // Place piece
        this.state.board[row][col] = this.currentPlayer;
        
        // Flip pieces
        for (const flip of validation.flips) {
            this.state.board[flip.row][flip.col] = this.currentPlayer;
        }
        
        // Update scores
        this.updateScores();
        
        // Reset pass count since a move was made
        this.state.passCount = 0;
        
        // Calculate valid moves for next player
        const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.state.validMoves = this.calculateValidMoves(this.state.board, nextPlayer);
    }

    updateScores() {
        let p1 = 0, p2 = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.state.board[r][c] === 1) p1++;
                else if (this.state.board[r][c] === 2) p2++;
            }
        }
        this.state.scores = { 1: p1, 2: p2 };
    }

    // Handle passing when no valid moves
    pass() {
        this.state.passCount++;
        
        // Calculate valid moves for next player
        const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.state.validMoves = this.calculateValidMoves(this.state.board, nextPlayer);
    }

    mustPass() {
        return this.state.validMoves.length === 0;
    }

    checkGameOver() {
        // Game ends when both players pass consecutively or board is full
        if (this.state.passCount >= 2) {
            return this.determineWinner('Both players passed');
        }
        
        // Check if board is full
        let totalPieces = this.state.scores[1] + this.state.scores[2];
        if (totalPieces === this.size * this.size) {
            return this.determineWinner('Board is full');
        }
        
        // Check if current player must pass and next player also has no moves
        if (this.mustPass()) {
            const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
            const nextMoves = this.calculateValidMoves(this.state.board, nextPlayer);
            if (nextMoves.length === 0) {
                return this.determineWinner('No moves remaining');
            }
        }
        
        return { gameOver: false };
    }

    determineWinner(reason) {
        let winner = null;
        if (this.state.scores[1] > this.state.scores[2]) {
            winner = 1;
        } else if (this.state.scores[2] > this.state.scores[1]) {
            winner = 2;
        }
        
        return {
            gameOver: true,
            winner,
            reason: winner 
                ? `${reason}. Player ${winner} wins ${this.state.scores[winner]} to ${this.state.scores[winner === 1 ? 2 : 1]}!`
                : `${reason}. Draw with ${this.state.scores[1]} each!`
        };
    }

    getValidMoves() {
        return this.state.validMoves;
    }

    render(ctx, boardElement) {
        if (boardElement) {
            this.renderDOM(boardElement);
        }
    }

    renderDOM(boardElement) {
        boardElement.className = 'reversi-board';
        
        const validMoveSet = new Set(this.state.validMoves.map(m => `${m.row},${m.col}`));
        
        let html = `
            <div class="reversi-header">
                <div class="reversi-score reversi-score--p1">
                    <span class="reversi-piece-icon reversi-piece-icon--black">●</span>
                    <span>${this.state.scores[1]}</span>
                </div>
                <div class="reversi-score reversi-score--p2">
                    <span class="reversi-piece-icon reversi-piece-icon--white">○</span>
                    <span>${this.state.scores[2]}</span>
                </div>
            </div>
            
            <div class="reversi-grid">
        `;
        
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const piece = this.state.board[r][c];
                const isValidMove = validMoveSet.has(`${r},${c}`);
                
                const cellClass = [
                    'reversi-cell',
                    isValidMove ? 'reversi-cell--valid' : ''
                ].filter(Boolean).join(' ');
                
                let content = '';
                if (piece === 1) {
                    content = '<div class="reversi-piece reversi-piece--black">●</div>';
                } else if (piece === 2) {
                    content = '<div class="reversi-piece reversi-piece--white">○</div>';
                } else if (isValidMove) {
                    content = '<div class="reversi-hint"></div>';
                }
                
                html += `
                    <div class="${cellClass}" data-row="${r}" data-col="${c}">
                        ${content}
                    </div>
                `;
            }
        }
        
        html += '</div>';
        
        // Pass button if needed
        if (this.mustPass()) {
            html += `
                <div class="reversi-pass-area">
                    <p>No valid moves available.</p>
                    <button class="reversi-pass-btn btn btn--primary">Pass Turn</button>
                </div>
            `;
        }
        
        boardElement.innerHTML = html;
        
        // Cell click handlers
        boardElement.querySelectorAll('.reversi-cell--valid').forEach(cell => {
            cell.addEventListener('click', () => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                const moveData = { row, col, player: this.currentPlayer };
                if (this.validateMove(moveData).valid) {
                    this.eventBus.emit('game:move', moveData);
                }
            });
        });
        
        // Pass button handler
        const passBtn = boardElement.querySelector('.reversi-pass-btn');
        if (passBtn) {
            passBtn.addEventListener('click', () => {
                this.pass();
                this.eventBus.emit('game:turnChange', { player: this.currentPlayer === 1 ? 2 : 1 });
                this.eventBus.emit('game:stateUpdate', this.getState());
            });
        }
    }

    // AI move for single player mode
    getAIMove() {
        const validMoves = this.getValidMoves();
        if (validMoves.length === 0) return null;
        
        // Simple strategy: prioritize corners, then edges, then max flips
        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        const edges = [];
        for (let i = 0; i < this.size; i++) {
            edges.push([0, i], [7, i], [i, 0], [i, 7]);
        }
        
        // Check for corner moves
        for (const [r, c] of corners) {
            const move = validMoves.find(m => m.row === r && m.col === c);
            if (move) return move;
        }
        
        // Check for edge moves
        for (const [r, c] of edges) {
            const move = validMoves.find(m => m.row === r && m.col === c);
            if (move) return move;
        }
        
        // Otherwise, pick move with most flips
        validMoves.sort((a, b) => b.flips.length - a.flips.length);
        return validMoves[0];
    }

    getMetadata() {
        return {
            id: 'reversi',
            name: 'Reversi',
            players: 2,
            description: 'Flip opponent pieces by sandwiching them between your own.'
        };
    }
}
