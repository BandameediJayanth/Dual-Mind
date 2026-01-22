/**
 * Ludo - Classic Board Game
 * Race your pieces around the board to home
 */

import { BaseGame } from './BaseGame.js';

export class Ludo extends BaseGame {
    constructor(eventBus) {
        super(eventBus);
        this.trackLength = 52; // Main track length
        this.homeStretch = 5;  // Home stretch length per player
        this.piecesPerPlayer = 4;
    }

    createInitialState() {
        // Each player has 4 pieces, starting in their base
        const pieces = {
            1: Array(this.piecesPerPlayer).fill(null).map((_, i) => ({
                id: i,
                position: -1, // -1 = in base
                homePosition: -1 // -1 = not in home stretch
            })),
            2: Array(this.piecesPerPlayer).fill(null).map((_, i) => ({
                id: i,
                position: -1,
                homePosition: -1
            }))
        };
        
        return {
            pieces,
            diceValue: null,
            selectedPiece: null,
            canRollDice: true,
            hasRolled: false,
            consecutiveSixes: 0,
            finishedPieces: { 1: 0, 2: 0 },
            startPositions: { 1: 0, 2: 26 }, // Player 1 starts at 0, Player 2 at 26
            homeEntries: { 1: 50, 2: 24 } // Where players enter home stretch
        };
    }

    rollDice() {
        if (!this.state.canRollDice) return null;
        
        this.state.diceValue = Math.floor(Math.random() * 6) + 1;
        this.state.hasRolled = true;
        this.state.canRollDice = false;
        
        // Track consecutive sixes
        if (this.state.diceValue === 6) {
            this.state.consecutiveSixes++;
            
            // Three sixes in a row = lose turn
            if (this.state.consecutiveSixes >= 3) {
                this.state.consecutiveSixes = 0;
                return { bust: true };
            }
        } else {
            this.state.consecutiveSixes = 0;
        }
        
        return { value: this.state.diceValue };
    }

    validateMove(moveData) {
        const { pieceId } = moveData;
        
        if (!this.state.hasRolled) {
            return { valid: false, reason: 'Roll the dice first' };
        }
        
        const piece = this.state.pieces[this.currentPlayer].find(p => p.id === pieceId);
        if (!piece) {
            return { valid: false, reason: 'Invalid piece' };
        }
        
        const validMoves = this.getValidMovesForPiece(piece);
        if (!validMoves.canMove) {
            return { valid: false, reason: validMoves.reason };
        }
        
        return { valid: true };
    }

    getValidMovesForPiece(piece) {
        const dice = this.state.diceValue;
        
        // Piece in base - need 6 to come out
        if (piece.position === -1) {
            if (dice === 6) {
                return { canMove: true, action: 'enter' };
            }
            return { canMove: false, reason: 'Need a 6 to enter the board' };
        }
        
        // Piece in home stretch
        if (piece.homePosition >= 0) {
            const newHomePos = piece.homePosition + dice;
            if (newHomePos === this.homeStretch) {
                return { canMove: true, action: 'finish' };
            }
            if (newHomePos < this.homeStretch) {
                return { canMove: true, action: 'moveHome' };
            }
            return { canMove: false, reason: 'Exact roll needed to finish' };
        }
        
        // Piece on track
        const startPos = this.state.startPositions[this.currentPlayer];
        const homeEntry = this.state.homeEntries[this.currentPlayer];
        const newPos = (piece.position + dice) % this.trackLength;
        
        // Check if entering home stretch
        const distanceToHome = (homeEntry - piece.position + this.trackLength) % this.trackLength;
        if (dice > distanceToHome && distanceToHome > 0) {
            const homeSteps = dice - distanceToHome - 1;
            if (homeSteps < this.homeStretch) {
                return { canMove: true, action: 'enterHome', homePosition: homeSteps };
            }
            if (homeSteps === this.homeStretch - 1) {
                return { canMove: true, action: 'finish' };
            }
            return { canMove: false, reason: 'Exact roll needed for home stretch' };
        }
        
        return { canMove: true, action: 'move', newPosition: newPos };
    }

    applyMove(moveData) {
        const { pieceId } = moveData;
        const piece = this.state.pieces[this.currentPlayer].find(p => p.id === pieceId);
        const moveInfo = this.getValidMovesForPiece(piece);
        
        switch (moveInfo.action) {
            case 'enter':
                piece.position = this.state.startPositions[this.currentPlayer];
                this.checkCapture(piece.position);
                break;
                
            case 'move':
                piece.position = moveInfo.newPosition;
                this.checkCapture(piece.position);
                break;
                
            case 'enterHome':
                piece.position = -2; // Marker for "in home stretch"
                piece.homePosition = moveInfo.homePosition;
                break;
                
            case 'moveHome':
                piece.homePosition += this.state.diceValue;
                break;
                
            case 'finish':
                piece.position = -3; // Marker for "finished"
                piece.homePosition = this.homeStretch;
                this.state.finishedPieces[this.currentPlayer]++;
                break;
        }
        
        // Can roll again if got 6 (and didn't bust)
        if (this.state.diceValue === 6 && this.state.consecutiveSixes < 3) {
            this.state.canRollDice = true;
            this.state.hasRolled = false;
        }
        
        this.state.selectedPiece = null;
        this.state.diceValue = null;
    }

    checkCapture(position) {
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        
        // Safe positions (stars and home entries)
        const safePositions = [0, 8, 13, 21, 26, 34, 39, 47];
        if (safePositions.includes(position)) return;
        
        // Check for opponent pieces at this position
        for (const piece of this.state.pieces[opponent]) {
            if (piece.position === position) {
                // Capture! Send back to base
                piece.position = -1;
                piece.homePosition = -1;
                this.lastCapture = true;
            }
        }
    }

    checkExtraTurn(moveData) {
        // Extra turn on 6 (handled in applyMove)
        return this.state.canRollDice;
    }

    checkGameOver() {
        if (this.state.finishedPieces[1] === this.piecesPerPlayer) {
            return { gameOver: true, winner: 1, reason: 'Player 1 finished all pieces!' };
        }
        if (this.state.finishedPieces[2] === this.piecesPerPlayer) {
            return { gameOver: true, winner: 2, reason: 'Player 2 finished all pieces!' };
        }
        return { gameOver: false };
    }

    getValidMoves() {
        if (!this.state.hasRolled) return [];
        
        const moves = [];
        for (const piece of this.state.pieces[this.currentPlayer]) {
            const moveInfo = this.getValidMovesForPiece(piece);
            if (moveInfo.canMove) {
                moves.push({ pieceId: piece.id, ...moveInfo });
            }
        }
        return moves;
    }

    hasValidMoves() {
        return this.getValidMoves().length > 0;
    }

    render(ctx, boardElement) {
        if (boardElement) {
            this.renderDOM(boardElement);
        }
    }

    renderDOM(boardElement) {
        boardElement.className = 'ludo-board';
        
        let html = `
            <div class="ludo-header">
                <div class="ludo-scores">
                    <span class="ludo-score ludo-score--p1">P1 Home: ${this.state.finishedPieces[1]}/${this.piecesPerPlayer}</span>
                    <span class="ludo-score ludo-score--p2">P2 Home: ${this.state.finishedPieces[2]}/${this.piecesPerPlayer}</span>
                </div>
            </div>
            
            <div class="ludo-dice-area">
                <div class="ludo-dice ${this.state.diceValue ? 'ludo-dice--rolled' : ''}">
                    ${this.state.diceValue || '?'}
                </div>
                <button class="ludo-roll-btn btn btn--primary" ${!this.state.canRollDice ? 'disabled' : ''}>
                    Roll Dice
                </button>
            </div>
        `;
        
        // Simplified board view - show player bases and pieces
        html += '<div class="ludo-game-area">';
        
        // Player 1 base
        html += `<div class="ludo-base ludo-base--p1">
            <div class="ludo-base-label">Player 1</div>
            <div class="ludo-base-pieces">
        `;
        
        for (const piece of this.state.pieces[1]) {
            const status = piece.position === -1 ? 'base' : 
                          piece.position === -3 ? 'home' : 'track';
            const isSelectable = this.currentPlayer === 1 && 
                                 this.state.hasRolled && 
                                 this.getValidMovesForPiece(piece).canMove;
            
            html += `
                <div class="ludo-piece ludo-piece--p1 ludo-piece--${status} ${isSelectable ? 'ludo-piece--selectable' : ''}"
                     data-player="1" data-piece="${piece.id}">
                    ${piece.position === -3 ? '★' : piece.id + 1}
                </div>
            `;
        }
        
        html += '</div></div>';
        
        // Track visualization (simplified)
        html += '<div class="ludo-track">';
        html += '<div class="ludo-track-info">';
        
        // Show pieces on track
        for (let player = 1; player <= 2; player++) {
            for (const piece of this.state.pieces[player]) {
                if (piece.position >= 0) {
                    html += `
                        <div class="ludo-track-piece ludo-track-piece--p${player}">
                            P${player}-${piece.id + 1}: Position ${piece.position}
                        </div>
                    `;
                } else if (piece.homePosition >= 0 && piece.position === -2) {
                    html += `
                        <div class="ludo-track-piece ludo-track-piece--p${player}">
                            P${player}-${piece.id + 1}: Home stretch ${piece.homePosition + 1}
                        </div>
                    `;
                }
            }
        }
        
        html += '</div></div>';
        
        // Player 2 base
        html += `<div class="ludo-base ludo-base--p2">
            <div class="ludo-base-label">Player 2</div>
            <div class="ludo-base-pieces">
        `;
        
        for (const piece of this.state.pieces[2]) {
            const status = piece.position === -1 ? 'base' : 
                          piece.position === -3 ? 'home' : 'track';
            const isSelectable = this.currentPlayer === 2 && 
                                 this.state.hasRolled && 
                                 this.getValidMovesForPiece(piece).canMove;
            
            html += `
                <div class="ludo-piece ludo-piece--p2 ludo-piece--${status} ${isSelectable ? 'ludo-piece--selectable' : ''}"
                     data-player="2" data-piece="${piece.id}">
                    ${piece.position === -3 ? '★' : piece.id + 1}
                </div>
            `;
        }
        
        html += '</div></div>';
        html += '</div>';
        
        // Valid moves info
        if (this.state.hasRolled) {
            const validMoves = this.getValidMoves();
            if (validMoves.length === 0) {
                html += '<div class="ludo-no-moves">No valid moves. Turn passes.</div>';
            } else {
                html += '<div class="ludo-hint">Click a highlighted piece to move</div>';
            }
        }
        
        boardElement.innerHTML = html;
        
        // Roll dice handler
        boardElement.querySelector('.ludo-roll-btn').addEventListener('click', () => {
            const result = this.rollDice();
            if (result) {
                if (result.bust) {
                    this.eventBus.emit('ui:toast', { message: 'Three sixes! Turn lost.', type: 'warning' });
                    this.state.canRollDice = true;
                    this.state.hasRolled = false;
                    this.eventBus.emit('game:turnChange', { player: this.currentPlayer === 1 ? 2 : 1 });
                } else {
                    this.eventBus.emit('game:stateUpdate', this.getState());
                    
                    // Auto-pass if no valid moves
                    if (!this.hasValidMoves()) {
                        setTimeout(() => {
                            this.state.canRollDice = true;
                            this.state.hasRolled = false;
                            this.eventBus.emit('game:turnChange', { player: this.currentPlayer === 1 ? 2 : 1 });
                        }, 1000);
                    }
                }
            }
        });
        
        // Piece click handlers
        boardElement.querySelectorAll('.ludo-piece--selectable').forEach(pieceEl => {
            pieceEl.addEventListener('click', () => {
                const pieceId = parseInt(pieceEl.dataset.piece);
                const moveData = { pieceId, player: this.currentPlayer };
                
                if (this.validateMove(moveData).valid) {
                    this.eventBus.emit('game:move', moveData);
                }
            });
        });
    }

    getMetadata() {
        return {
            id: 'ludo',
            name: 'Ludo',
            players: 2,
            description: 'Race your pieces around the board and into your home!'
        };
    }
}
