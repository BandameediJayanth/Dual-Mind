/**
 * Checkers - Classic Board Game
 * Jump over opponent pieces to capture them
 */

import { BaseGame } from './BaseGame.js';

export class Checkers extends BaseGame {
    constructor(eventBus) {
        super(eventBus);
        this.size = 8;
    }

    createInitialState() {
        const board = [];
        for (let r = 0; r < this.size; r++) {
            board.push(Array(this.size).fill(null));
        }
        
        // Place player 2 pieces (top)
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < this.size; c++) {
                if ((r + c) % 2 === 1) {
                    board[r][c] = { player: 2, king: false };
                }
            }
        }
        
        // Place player 1 pieces (bottom)
        for (let r = 5; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if ((r + c) % 2 === 1) {
                    board[r][c] = { player: 1, king: false };
                }
            }
        }
        
        return {
            board,
            selectedPiece: null,
            mustJump: null,
            capturedPieces: { 1: 0, 2: 0 }
        };
    }

    validateMove(moveData) {
        const { from, to } = moveData;
        
        if (!from || !to) {
            return { valid: false, reason: 'Invalid move data' };
        }
        
        const piece = this.state.board[from.row][from.col];
        if (!piece || piece.player !== this.currentPlayer) {
            return { valid: false, reason: 'Not your piece' };
        }
        
        const validMoves = this.getValidMovesForPiece(from.row, from.col);
        const isValid = validMoves.some(m => m.to.row === to.row && m.to.col === to.col);
        
        if (!isValid) {
            return { valid: false, reason: 'Invalid move' };
        }
        
        // If must jump, check if this is a jump
        if (this.state.mustJump) {
            const isJump = Math.abs(to.row - from.row) === 2;
            if (!isJump) {
                return { valid: false, reason: 'Must complete jump sequence' };
            }
        }
        
        return { valid: true };
    }

    applyMove(moveData) {
        const { from, to } = moveData;
        const piece = this.state.board[from.row][from.col];
        
        // Move piece
        this.state.board[to.row][to.col] = piece;
        this.state.board[from.row][from.col] = null;
        
        // Check for jump (capture)
        const rowDiff = Math.abs(to.row - from.row);
        if (rowDiff === 2) {
            const jumpedRow = (from.row + to.row) / 2;
            const jumpedCol = (from.col + to.col) / 2;
            this.state.board[jumpedRow][jumpedCol] = null;
            this.state.capturedPieces[this.currentPlayer]++;
            
            // Check for multi-jump
            const furtherJumps = this.getJumpsForPiece(to.row, to.col);
            if (furtherJumps.length > 0) {
                this.state.mustJump = { row: to.row, col: to.col };
                return; // Don't promote yet, allow multi-jump
            }
        }
        
        // Check for king promotion
        if ((this.currentPlayer === 1 && to.row === 0) ||
            (this.currentPlayer === 2 && to.row === this.size - 1)) {
            this.state.board[to.row][to.col].king = true;
        }
        
        this.state.mustJump = null;
    }

    checkExtraTurn(moveData) {
        return this.state.mustJump !== null;
    }

    checkGameOver() {
        // Check if opponent has pieces
        let player1Pieces = 0;
        let player2Pieces = 0;
        
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const piece = this.state.board[r][c];
                if (piece) {
                    if (piece.player === 1) player1Pieces++;
                    else player2Pieces++;
                }
            }
        }
        
        if (player1Pieces === 0) {
            return { gameOver: true, winner: 2, reason: 'All pieces captured' };
        }
        if (player2Pieces === 0) {
            return { gameOver: true, winner: 1, reason: 'All pieces captured' };
        }
        
        // Check if current player has valid moves
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        const opponentMoves = this.getAllValidMoves(opponent);
        if (opponentMoves.length === 0) {
            return { gameOver: true, winner: this.currentPlayer, reason: 'No valid moves' };
        }
        
        return { gameOver: false };
    }

    getValidMoves() {
        if (this.state.mustJump) {
            return this.getJumpsForPiece(this.state.mustJump.row, this.state.mustJump.col);
        }
        return this.getAllValidMoves(this.currentPlayer);
    }

    getAllValidMoves(player) {
        const moves = [];
        let hasJumps = false;
        
        // First check for jumps (mandatory)
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const piece = this.state.board[r][c];
                if (piece && piece.player === player) {
                    const jumps = this.getJumpsForPiece(r, c);
                    if (jumps.length > 0) {
                        hasJumps = true;
                        moves.push(...jumps);
                    }
                }
            }
        }
        
        // If no jumps, get regular moves
        if (!hasJumps) {
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    const piece = this.state.board[r][c];
                    if (piece && piece.player === player) {
                        moves.push(...this.getValidMovesForPiece(r, c));
                    }
                }
            }
        }
        
        return moves;
    }

    getValidMovesForPiece(row, col) {
        const piece = this.state.board[row][col];
        if (!piece) return [];
        
        const moves = [];
        const jumps = this.getJumpsForPiece(row, col);
        
        // If there are jumps available for this player, must jump
        const hasAnyJumps = this.getAllValidMoves(piece.player).some(m => 
            Math.abs(m.to.row - m.from.row) === 2
        );
        
        if (hasAnyJumps) {
            return jumps;
        }
        
        // Regular moves
        const directions = piece.king 
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : piece.player === 1 
                ? [[-1, -1], [-1, 1]] 
                : [[1, -1], [1, 1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < this.size && 
                newCol >= 0 && newCol < this.size &&
                this.state.board[newRow][newCol] === null) {
                moves.push({
                    from: { row, col },
                    to: { row: newRow, col: newCol }
                });
            }
        }
        
        return moves;
    }

    getJumpsForPiece(row, col) {
        const piece = this.state.board[row][col];
        if (!piece) return [];
        
        const jumps = [];
        const directions = piece.king 
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : piece.player === 1 
                ? [[-1, -1], [-1, 1]] 
                : [[1, -1], [1, 1]];
        
        for (const [dr, dc] of directions) {
            const jumpedRow = row + dr;
            const jumpedCol = col + dc;
            const landRow = row + dr * 2;
            const landCol = col + dc * 2;
            
            if (landRow >= 0 && landRow < this.size && 
                landCol >= 0 && landCol < this.size) {
                const jumpedPiece = this.state.board[jumpedRow][jumpedCol];
                const landCell = this.state.board[landRow][landCol];
                
                if (jumpedPiece && jumpedPiece.player !== piece.player && landCell === null) {
                    jumps.push({
                        from: { row, col },
                        to: { row: landRow, col: landCol },
                        captured: { row: jumpedRow, col: jumpedCol }
                    });
                }
            }
        }
        
        return jumps;
    }

    render(ctx, boardElement) {
        if (boardElement) {
            this.renderDOM(boardElement);
        }
    }

    renderDOM(boardElement) {
        boardElement.style.display = 'grid';
        boardElement.className = 'checkers-board';
        
        let html = '';
        
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const isLight = (r + c) % 2 === 0;
                const piece = this.state.board[r][c];
                const isSelected = this.state.selectedPiece?.row === r && 
                                   this.state.selectedPiece?.col === c;
                
                html += `
                    <div class="checkers-cell checkers-cell--${isLight ? 'light' : 'dark'} ${isSelected ? 'checkers-cell--highlight' : ''}" 
                         data-row="${r}" data-col="${c}">
                        ${piece ? `
                            <div class="checkers-piece checkers-piece--${piece.player === 1 ? 'red' : 'black'} ${isSelected ? 'checkers-piece--selected' : ''}">
                                ${piece.king ? '<span>♔</span>' : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        }
        
        boardElement.innerHTML = html;

        boardElement.querySelectorAll('.checkers-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.handleCellClick(row, col);
            });
        });
    }

    handleCellClick(row, col) {
        const piece = this.state.board[row][col];
        
        if (this.state.selectedPiece) {
            // Try to move to this cell
            const from = this.state.selectedPiece;
            const moveData = { from, to: { row, col }, player: this.currentPlayer };
            
            if (this.validateMove(moveData).valid) {
                this.eventBus.emit('game:move', moveData);
            }
            this.state.selectedPiece = null;
        } else if (piece && piece.player === this.currentPlayer) {
            // Select this piece
            this.state.selectedPiece = { row, col };
        }
        
        this.eventBus.emit('game:stateUpdate', this.getState());
    }

    getMetadata() {
        return {
            id: 'checkers',
            name: 'Checkers',
            players: 2,
            description: 'Jump over opponent pieces to capture them.'
        };
    }
}
