/**
 * Word Chain - Word Association Game
 * Each word must start with the last letter of the previous word
 */

import { BaseGame } from './BaseGame.js';

export class WordChain extends BaseGame {
    constructor(eventBus) {
        super(eventBus);
        this.minWordLength = 3;
        this.turnTimeLimit = 30; // seconds
        
        // Basic word validation - in production, use a dictionary API
        this.commonWords = new Set([
            'apple', 'elephant', 'tiger', 'rabbit', 'tree', 'eagle', 'elephant',
            'ant', 'turtle', 'ear', 'rain', 'night', 'table', 'egg', 'goat',
            'train', 'nest', 'star', 'river', 'rose', 'earth', 'heart', 'time',
            'eye', 'end', 'dog', 'game', 'echo', 'orange', 'energy', 'yellow',
            'water', 'rain', 'nice', 'every', 'year', 'real', 'love', 'even',
            'never', 'ring', 'grape', 'enter', 'ratio', 'ocean', 'noon', 'name'
        ]);
    }

    createInitialState() {
        const starterWords = ['apple', 'game', 'tiger', 'ocean', 'night'];
        const startWord = starterWords[Math.floor(Math.random() * starterWords.length)];
        
        return {
            words: [{ word: startWord, player: 0 }], // Player 0 = system
            currentLetter: startWord.slice(-1).toUpperCase(),
            usedWords: new Set([startWord.toLowerCase()]),
            scores: { 1: 0, 2: 0 },
            currentInput: '',
            invalidReason: null,
            turnStartTime: Date.now()
        };
    }

    validateMove(moveData) {
        const { word } = moveData;
        
        if (!word || typeof word !== 'string') {
            return { valid: false, reason: 'Please enter a word' };
        }
        
        const cleanWord = word.trim().toLowerCase();
        
        if (cleanWord.length < this.minWordLength) {
            return { valid: false, reason: `Word must be at least ${this.minWordLength} letters` };
        }
        
        if (!/^[a-z]+$/.test(cleanWord)) {
            return { valid: false, reason: 'Word must contain only letters' };
        }
        
        const requiredLetter = this.state.currentLetter.toLowerCase();
        if (cleanWord[0] !== requiredLetter) {
            return { valid: false, reason: `Word must start with "${this.state.currentLetter}"` };
        }
        
        if (this.state.usedWords.has(cleanWord)) {
            return { valid: false, reason: 'Word has already been used' };
        }
        
        // In production, validate against a dictionary API
        // For now, accept all properly formatted words
        
        return { valid: true };
    }

    applyMove(moveData) {
        const { word } = moveData;
        const cleanWord = word.trim().toLowerCase();
        
        this.state.words.push({ word: cleanWord, player: this.currentPlayer });
        this.state.usedWords.add(cleanWord);
        this.state.currentLetter = cleanWord.slice(-1).toUpperCase();
        this.state.scores[this.currentPlayer] += cleanWord.length; // Score by word length
        this.state.currentInput = '';
        this.state.invalidReason = null;
        this.state.turnStartTime = Date.now();
    }

    checkGameOver() {
        // Game continues until a player can't think of a word (timeout)
        // Or reaches a score threshold
        const scoreLimit = 50;
        
        if (this.state.scores[1] >= scoreLimit) {
            return { gameOver: true, winner: 1, reason: 'Player 1 reached the score limit!' };
        }
        if (this.state.scores[2] >= scoreLimit) {
            return { gameOver: true, winner: 2, reason: 'Player 2 reached the score limit!' };
        }
        
        return { gameOver: false };
    }

    getValidMoves() {
        // Return hints - words starting with current letter
        const hints = [];
        const letter = this.state.currentLetter.toLowerCase();
        
        for (const word of this.commonWords) {
            if (word[0] === letter && !this.state.usedWords.has(word)) {
                hints.push({ word });
            }
        }
        
        return hints;
    }

    // Handle player giving up / timeout
    forfeit(player) {
        const opponent = player === 1 ? 2 : 1;
        return {
            gameOver: true,
            winner: opponent,
            reason: `Player ${player} couldn't think of a word!`
        };
    }

    render(ctx, boardElement) {
        if (boardElement) {
            this.renderDOM(boardElement);
        }
    }

    renderDOM(boardElement) {
        boardElement.className = 'wordchain-board';
        
        let html = `
            <div class="wordchain-header">
                <div class="wordchain-scores">
                    <span class="wordchain-score wordchain-score--p1">P1: ${this.state.scores[1]}</span>
                    <span class="wordchain-score wordchain-score--p2">P2: ${this.state.scores[2]}</span>
                </div>
                <div class="wordchain-current-letter">
                    Next word starts with: <strong>${this.state.currentLetter}</strong>
                </div>
            </div>
            
            <div class="wordchain-words">
        `;
        
        // Show last 10 words
        const recentWords = this.state.words.slice(-10);
        for (const entry of recentWords) {
            const playerClass = entry.player === 0 ? 'wordchain-word--system' : `wordchain-word--p${entry.player}`;
            html += `<span class="wordchain-word ${playerClass}">${entry.word}</span>`;
        }
        
        html += '</div>';
        
        // Input area
        html += `
            <div class="wordchain-input-area">
                <input type="text" 
                       class="wordchain-input" 
                       placeholder="Enter a word starting with ${this.state.currentLetter}..."
                       value="${this.state.currentInput || ''}"
                       maxlength="20"
                       autocomplete="off">
                <button class="wordchain-submit btn btn--primary">Submit</button>
                <button class="wordchain-skip btn btn--secondary">Give Up</button>
            </div>
        `;
        
        if (this.state.invalidReason) {
            html += `<div class="wordchain-error">${this.state.invalidReason}</div>`;
        }
        
        // Hints
        const hints = this.getValidMoves().slice(0, 3);
        if (hints.length > 0) {
            html += `<div class="wordchain-hints">Hints: ${hints.map(h => h.word).join(', ')}</div>`;
        }
        
        boardElement.innerHTML = html;
        
        // Add event handlers
        const input = boardElement.querySelector('.wordchain-input');
        const submitBtn = boardElement.querySelector('.wordchain-submit');
        const skipBtn = boardElement.querySelector('.wordchain-skip');
        
        input.addEventListener('input', (e) => {
            this.state.currentInput = e.target.value;
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.submitWord();
            }
        });
        
        submitBtn.addEventListener('click', () => {
            this.submitWord();
        });
        
        skipBtn.addEventListener('click', () => {
            const result = this.forfeit(this.currentPlayer);
            this.eventBus.emit('game:end', result);
        });
        
        // Focus input
        input.focus();
    }

    submitWord() {
        const word = this.state.currentInput;
        const validation = this.validateMove({ word });
        
        if (validation.valid) {
            this.eventBus.emit('game:move', { word, player: this.currentPlayer });
        } else {
            this.state.invalidReason = validation.reason;
            this.eventBus.emit('game:stateUpdate', this.getState());
        }
    }

    getMetadata() {
        return {
            id: 'wordchain',
            name: 'Word Chain',
            players: 2,
            description: 'Enter words that start with the last letter of the previous word.'
        };
    }
}
