/**
 * Memory Match - Card Matching Game
 * Find matching pairs of cards
 */

import { BaseGame } from './BaseGame.js';

export class MemoryMatch extends BaseGame {
    constructor(eventBus) {
        super(eventBus);
        this.gridSize = 4; // 4x4 = 16 cards = 8 pairs
        this.symbols = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];
    }

    createInitialState() {
        // Create pairs
        const pairs = [];
        for (let i = 0; i < (this.gridSize * this.gridSize) / 2; i++) {
            const symbol = this.symbols[i % this.symbols.length];
            pairs.push({ id: i, symbol, matched: false });
            pairs.push({ id: i, symbol, matched: false });
        }
        
        // Shuffle cards
        const cards = this.shuffleArray(pairs);
        
        // Create grid
        const grid = [];
        let cardIndex = 0;
        for (let r = 0; r < this.gridSize; r++) {
            const row = [];
            for (let c = 0; c < this.gridSize; c++) {
                row.push({
                    ...cards[cardIndex],
                    flipped: false,
                    position: { row: r, col: c }
                });
                cardIndex++;
            }
            grid.push(row);
        }
        
        return {
            grid,
            flippedCards: [],
            scores: { 1: 0, 2: 0 },
            totalPairs: (this.gridSize * this.gridSize) / 2,
            matchedPairs: 0,
            isChecking: false
        };
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    validateMove(moveData) {
        const { row, col } = moveData;
        
        if (this.state.isChecking) {
            return { valid: false, reason: 'Wait for cards to flip back' };
        }
        
        if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
            return { valid: false, reason: 'Out of bounds' };
        }
        
        const card = this.state.grid[row][col];
        
        if (card.matched) {
            return { valid: false, reason: 'Card already matched' };
        }
        
        if (card.flipped) {
            return { valid: false, reason: 'Card already flipped' };
        }
        
        if (this.state.flippedCards.length >= 2) {
            return { valid: false, reason: 'Two cards already flipped' };
        }
        
        return { valid: true };
    }

    applyMove(moveData) {
        const { row, col } = moveData;
        const card = this.state.grid[row][col];
        
        card.flipped = true;
        this.state.flippedCards.push({ row, col });
        
        // Check for match when two cards are flipped
        if (this.state.flippedCards.length === 2) {
            const [first, second] = this.state.flippedCards;
            const card1 = this.state.grid[first.row][first.col];
            const card2 = this.state.grid[second.row][second.col];
            
            if (card1.id === card2.id) {
                // Match found!
                card1.matched = true;
                card2.matched = true;
                this.state.scores[this.currentPlayer]++;
                this.state.matchedPairs++;
                this.state.flippedCards = [];
                this.lastMoveMatched = true;
            } else {
                // No match - cards will flip back
                this.lastMoveMatched = false;
                this.state.isChecking = true;
                
                // Schedule flip back (handled by render/UI)
                setTimeout(() => {
                    card1.flipped = false;
                    card2.flipped = false;
                    this.state.flippedCards = [];
                    this.state.isChecking = false;
                    this.eventBus.emit('game:stateUpdate', this.getState());
                }, 1000);
            }
        }
    }

    checkExtraTurn(moveData) {
        // Player gets extra turn if they found a match
        // Or if they only flipped one card
        return this.lastMoveMatched || this.state.flippedCards.length === 1;
    }

    checkGameOver() {
        if (this.state.matchedPairs === this.state.totalPairs) {
            let winner = null;
            if (this.state.scores[1] > this.state.scores[2]) {
                winner = 1;
            } else if (this.state.scores[2] > this.state.scores[1]) {
                winner = 2;
            }
            return { 
                gameOver: true, 
                winner, 
                reason: winner ? `Player ${winner} wins with ${this.state.scores[winner]} pairs!` : 'Draw!' 
            };
        }
        return { gameOver: false };
    }

    getValidMoves() {
        const moves = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const card = this.state.grid[r][c];
                if (!card.matched && !card.flipped) {
                    moves.push({ row: r, col: c });
                }
            }
        }
        return moves;
    }

    render(ctx, boardElement) {
        if (boardElement) {
            this.renderDOM(boardElement);
        }
    }

    renderDOM(boardElement) {
        boardElement.className = 'memory-board';
        
        let html = `<div class="memory-scores">
            <span class="memory-score memory-score--p1">P1: ${this.state.scores[1]}</span>
            <span class="memory-score memory-score--p2">P2: ${this.state.scores[2]}</span>
        </div>`;
        
        html += '<div class="memory-grid">';
        
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const card = this.state.grid[r][c];
                const cardClass = card.matched 
                    ? 'memory-card--matched' 
                    : card.flipped 
                        ? 'memory-card--flipped' 
                        : '';
                
                html += `
                    <div class="memory-card ${cardClass}" data-row="${r}" data-col="${c}">
                        <div class="memory-card-inner">
                            <div class="memory-card-front">?</div>
                            <div class="memory-card-back">${card.symbol}</div>
                        </div>
                    </div>
                `;
            }
        }
        
        html += '</div>';
        
        boardElement.innerHTML = html;
        
        // Add click handlers
        boardElement.querySelectorAll('.memory-card').forEach(cardEl => {
            cardEl.addEventListener('click', () => {
                const row = parseInt(cardEl.dataset.row);
                const col = parseInt(cardEl.dataset.col);
                
                const moveData = { row, col, player: this.currentPlayer };
                if (this.validateMove(moveData).valid) {
                    this.eventBus.emit('game:move', moveData);
                }
            });
        });
    }

    getMetadata() {
        return {
            id: 'memorymatch',
            name: 'Memory Match',
            players: 2,
            description: 'Find matching pairs of cards. Match a pair to score and go again!'
        };
    }
}
