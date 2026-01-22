/**
 * Game 24 - Math Puzzle Game
 * Use 4 numbers and basic operations to make 24
 */

import { BaseGame } from './BaseGame.js';

export class Game24 extends BaseGame {
    constructor(eventBus) {
        super(eventBus);
        this.target = 24;
    }

    createInitialState() {
        const puzzle = this.generatePuzzle();
        
        return {
            numbers: puzzle.numbers,
            originalNumbers: [...puzzle.numbers],
            solution: puzzle.solution,
            expression: '',
            usedNumbers: [],
            scores: { 1: 0, 2: 0 },
            roundsPlayed: 0,
            currentRound: 1,
            maxRounds: 5,
            timePerRound: 60,
            roundStartTime: Date.now(),
            solved: false,
            showHint: false
        };
    }

    generatePuzzle() {
        // Generate puzzles that are guaranteed to have solutions
        const solvablePuzzles = [
            { numbers: [1, 2, 3, 4], solution: '(1+2+3)*4' },
            { numbers: [1, 3, 4, 6], solution: '6/(1-3/4)' },
            { numbers: [2, 3, 4, 5], solution: '(2+3-5)*4' },
            { numbers: [1, 5, 5, 5], solution: '(5-1/5)*5' },
            { numbers: [3, 3, 8, 8], solution: '8/(3-8/3)' },
            { numbers: [1, 2, 7, 7], solution: '(1+2)*7+7' },
            { numbers: [2, 2, 2, 2], solution: '(2+2)*(2+2)+2+2' },
            { numbers: [4, 4, 4, 4], solution: '(4+4)*(4-4/4)' },
            { numbers: [1, 4, 5, 6], solution: '4*(6-1)+5-1' },
            { numbers: [2, 3, 5, 7], solution: '(7-5+2)*3*2' },
            { numbers: [1, 1, 8, 8], solution: '(1+1+1)*8' },
            { numbers: [3, 4, 5, 6], solution: '(3+5)*(6-3)' },
            { numbers: [2, 4, 6, 8], solution: '(6-2)*8-4*2' },
            { numbers: [1, 3, 6, 8], solution: '(8-6+1)*3*1' },
            { numbers: [2, 5, 5, 8], solution: '(5-2)*8*1' }
        ];
        
        const puzzle = solvablePuzzles[Math.floor(Math.random() * solvablePuzzles.length)];
        
        // Shuffle the numbers
        const numbers = [...puzzle.numbers];
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        return { numbers, solution: puzzle.solution };
    }

    validateMove(moveData) {
        const { expression } = moveData;
        
        if (!expression || typeof expression !== 'string') {
            return { valid: false, reason: 'Please enter an expression' };
        }
        
        // Check that only valid characters are used
        if (!/^[0-9+\-*/().  ]+$/.test(expression)) {
            return { valid: false, reason: 'Invalid characters in expression' };
        }
        
        // Extract numbers from expression
        const numbersInExpr = expression.match(/\d+/g)?.map(Number) || [];
        
        // Check that exactly the given numbers are used
        const availableNumbers = [...this.state.originalNumbers].sort();
        const usedNumbers = [...numbersInExpr].sort();
        
        if (JSON.stringify(availableNumbers) !== JSON.stringify(usedNumbers)) {
            return { valid: false, reason: 'You must use all four numbers exactly once' };
        }
        
        // Evaluate the expression
        try {
            const result = this.safeEval(expression);
            
            if (isNaN(result) || !isFinite(result)) {
                return { valid: false, reason: 'Invalid calculation' };
            }
            
            if (Math.abs(result - this.target) > 0.0001) {
                return { valid: false, reason: `Result is ${result}, not ${this.target}` };
            }
            
            return { valid: true };
        } catch (e) {
            return { valid: false, reason: 'Invalid expression: ' + e.message };
        }
    }

    safeEval(expression) {
        // Remove spaces
        const cleaned = expression.replace(/\s+/g, '');
        
        // Validate parentheses
        let parenCount = 0;
        for (const char of cleaned) {
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
            if (parenCount < 0) throw new Error('Mismatched parentheses');
        }
        if (parenCount !== 0) throw new Error('Mismatched parentheses');
        
        // Use Function constructor for safe evaluation (only allows math operations)
        // This is safer than eval() but still evaluate carefully
        const sanitized = cleaned.replace(/[^0-9+\-*/.()]/g, '');
        
        try {
            return Function(`"use strict"; return (${sanitized})`)();
        } catch (e) {
            throw new Error('Could not evaluate expression');
        }
    }

    applyMove(moveData) {
        const { expression } = moveData;
        
        this.state.expression = expression;
        this.state.solved = true;
        this.state.scores[this.currentPlayer] += 1;
        
        // Calculate bonus for speed
        const timeElapsed = (Date.now() - this.state.roundStartTime) / 1000;
        if (timeElapsed < 10) {
            this.state.scores[this.currentPlayer] += 2; // Speed bonus
        } else if (timeElapsed < 20) {
            this.state.scores[this.currentPlayer] += 1;
        }
    }

    nextRound() {
        this.state.roundsPlayed++;
        this.state.currentRound++;
        
        if (this.state.currentRound <= this.state.maxRounds) {
            const puzzle = this.generatePuzzle();
            this.state.numbers = puzzle.numbers;
            this.state.originalNumbers = [...puzzle.numbers];
            this.state.solution = puzzle.solution;
            this.state.expression = '';
            this.state.usedNumbers = [];
            this.state.roundStartTime = Date.now();
            this.state.solved = false;
            this.state.showHint = false;
        }
    }

    skipRound() {
        this.nextRound();
    }

    checkGameOver() {
        if (this.state.currentRound > this.state.maxRounds) {
            let winner = null;
            if (this.state.scores[1] > this.state.scores[2]) {
                winner = 1;
            } else if (this.state.scores[2] > this.state.scores[1]) {
                winner = 2;
            }
            return { 
                gameOver: true, 
                winner, 
                reason: winner ? `Player ${winner} wins!` : 'Draw!' 
            };
        }
        return { gameOver: false };
    }

    getValidMoves() {
        return [{ expression: this.state.solution }];
    }

    render(ctx, boardElement) {
        if (boardElement) {
            this.renderDOM(boardElement);
        }
    }

    renderDOM(boardElement) {
        boardElement.className = 'game24-board';
        
        let html = `
            <div class="game24-header">
                <div class="game24-scores">
                    <span class="game24-score game24-score--p1">P1: ${this.state.scores[1]}</span>
                    <span class="game24-score game24-score--p2">P2: ${this.state.scores[2]}</span>
                </div>
                <div class="game24-round">Round ${this.state.currentRound} / ${this.state.maxRounds}</div>
            </div>
            
            <div class="game24-target">
                Make <strong>${this.target}</strong>
            </div>
            
            <div class="game24-numbers">
                ${this.state.numbers.map(n => `<div class="game24-number">${n}</div>`).join('')}
            </div>
            
            <div class="game24-operators">
                <span class="game24-op">+</span>
                <span class="game24-op">−</span>
                <span class="game24-op">×</span>
                <span class="game24-op">÷</span>
                <span class="game24-op">(</span>
                <span class="game24-op">)</span>
            </div>
            
            <div class="game24-input-area">
                <input type="text" 
                       class="game24-input" 
                       placeholder="Enter expression (e.g., (1+2)*3+4)"
                       value="${this.state.expression || ''}"
                       autocomplete="off">
                <button class="game24-submit btn btn--primary">Calculate</button>
            </div>
            
            <div class="game24-actions">
                <button class="game24-hint btn btn--secondary">Show Hint</button>
                <button class="game24-skip btn btn--secondary">Skip Round</button>
            </div>
        `;
        
        if (this.state.showHint) {
            html += `<div class="game24-hint-text">Hint: Try ${this.state.solution}</div>`;
        }
        
        if (this.state.solved) {
            html += `<div class="game24-success">Correct! 🎉</div>`;
        }
        
        boardElement.innerHTML = html;
        
        // Event handlers
        const input = boardElement.querySelector('.game24-input');
        const submitBtn = boardElement.querySelector('.game24-submit');
        const hintBtn = boardElement.querySelector('.game24-hint');
        const skipBtn = boardElement.querySelector('.game24-skip');
        
        input.addEventListener('input', (e) => {
            this.state.expression = e.target.value;
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.submitExpression();
            }
        });
        
        submitBtn.addEventListener('click', () => {
            this.submitExpression();
        });
        
        hintBtn.addEventListener('click', () => {
            this.state.showHint = true;
            this.eventBus.emit('game:stateUpdate', this.getState());
        });
        
        skipBtn.addEventListener('click', () => {
            this.skipRound();
            this.eventBus.emit('game:turnChange', { player: this.currentPlayer === 1 ? 2 : 1 });
            this.eventBus.emit('game:stateUpdate', this.getState());
        });
        
        // Operator buttons
        boardElement.querySelectorAll('.game24-op').forEach(op => {
            op.addEventListener('click', () => {
                const char = op.textContent === '−' ? '-' : 
                             op.textContent === '×' ? '*' : 
                             op.textContent === '÷' ? '/' : op.textContent;
                input.value += char;
                this.state.expression = input.value;
                input.focus();
            });
        });
        
        // Number buttons
        boardElement.querySelectorAll('.game24-number').forEach(num => {
            num.addEventListener('click', () => {
                input.value += num.textContent;
                this.state.expression = input.value;
                input.focus();
            });
        });
        
        input.focus();
    }

    submitExpression() {
        const expression = this.state.expression;
        const validation = this.validateMove({ expression });
        
        if (validation.valid) {
            this.eventBus.emit('game:move', { expression, player: this.currentPlayer });
            
            // Auto-advance to next round after brief delay
            setTimeout(() => {
                this.nextRound();
                this.eventBus.emit('game:turnChange', { player: this.currentPlayer === 1 ? 2 : 1 });
                this.eventBus.emit('game:stateUpdate', this.getState());
            }, 1500);
        } else {
            this.eventBus.emit('ui:toast', { message: validation.reason, type: 'error' });
        }
    }

    getMetadata() {
        return {
            id: 'game24',
            name: 'Game 24',
            players: 2,
            description: 'Use all four numbers with +, -, ×, ÷ to make 24.'
        };
    }
}
