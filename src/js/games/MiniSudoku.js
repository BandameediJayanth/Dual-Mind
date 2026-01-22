/**
 * Mini Sudoku - 4x4 Number Puzzle
 * Fill the grid so each row, column, and 2x2 box has numbers 1-4
 */

import { BaseGame } from './BaseGame.js';

export class MiniSudoku extends BaseGame {
    constructor(eventBus) {
        super(eventBus);
        this.size = 4;
        this.boxSize = 2;
    }

    createInitialState() {
        const puzzle = this.generatePuzzle();
        
        return {
            grid: puzzle.grid,
            solution: puzzle.solution,
            fixed: puzzle.fixed,
            selectedCell: null,
            errors: [],
            scores: { 1: 0, 2: 0 },
            moveCount: 0,
            startTime: Date.now(),
            completed: false
        };
    }

    generatePuzzle() {
        // Generate a solved grid first
        const solution = this.generateSolvedGrid();
        
        // Create a copy and remove some numbers
        const grid = solution.map(row => [...row]);
        const fixed = grid.map(row => row.map(() => false));
        
        // Remove random cells (keep about 6-8 hints)
        const cellsToRemove = 8 + Math.floor(Math.random() * 3);
        const allCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                allCells.push({ r, c });
            }
        }
        
        // Shuffle and remove
        this.shuffleArray(allCells);
        for (let i = 0; i < cellsToRemove && i < allCells.length; i++) {
            const { r, c } = allCells[i];
            grid[r][c] = 0;
        }
        
        // Mark remaining cells as fixed
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                fixed[r][c] = grid[r][c] !== 0;
            }
        }
        
        return { grid, solution, fixed };
    }

    generateSolvedGrid() {
        // Start with a valid 4x4 sudoku pattern
        const patterns = [
            [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]],
            [[1,2,3,4],[3,4,1,2],[4,3,2,1],[2,1,4,3]],
            [[2,1,4,3],[4,3,2,1],[1,2,3,4],[3,4,1,2]],
            [[3,4,1,2],[1,2,3,4],[4,3,2,1],[2,1,4,3]]
        ];
        
        let grid = patterns[Math.floor(Math.random() * patterns.length)].map(row => [...row]);
        
        // Shuffle rows within bands and columns within stacks
        // Swap rows 0,1 randomly
        if (Math.random() > 0.5) {
            [grid[0], grid[1]] = [grid[1], grid[0]];
        }
        // Swap rows 2,3 randomly
        if (Math.random() > 0.5) {
            [grid[2], grid[3]] = [grid[3], grid[2]];
        }
        
        // Swap columns within stacks
        if (Math.random() > 0.5) {
            for (let r = 0; r < 4; r++) {
                [grid[r][0], grid[r][1]] = [grid[r][1], grid[r][0]];
            }
        }
        if (Math.random() > 0.5) {
            for (let r = 0; r < 4; r++) {
                [grid[r][2], grid[r][3]] = [grid[r][3], grid[r][2]];
            }
        }
        
        // Randomly permute the digits
        const permutation = [1, 2, 3, 4];
        this.shuffleArray(permutation);
        
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                grid[r][c] = permutation[grid[r][c] - 1];
            }
        }
        
        return grid;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    validateMove(moveData) {
        const { row, col, value } = moveData;
        
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return { valid: false, reason: 'Out of bounds' };
        }
        
        if (this.state.fixed[row][col]) {
            return { valid: false, reason: 'Cannot modify fixed cell' };
        }
        
        if (value < 0 || value > this.size) {
            return { valid: false, reason: 'Invalid value' };
        }
        
        return { valid: true };
    }

    applyMove(moveData) {
        const { row, col, value } = moveData;
        this.state.grid[row][col] = value;
        this.state.moveCount++;
        
        // Check for errors
        this.state.errors = this.findErrors();
        
        // Check if completed correctly
        if (this.checkComplete()) {
            this.state.completed = true;
            this.state.scores[this.currentPlayer] += 1;
            
            // Bonus for no errors during solve
            if (this.state.moveCount <= 10) {
                this.state.scores[this.currentPlayer] += 1;
            }
        }
    }

    findErrors() {
        const errors = [];
        
        // Check rows
        for (let r = 0; r < this.size; r++) {
            const seen = {};
            for (let c = 0; c < this.size; c++) {
                const val = this.state.grid[r][c];
                if (val !== 0) {
                    if (seen[val]) {
                        errors.push({ r, c });
                        errors.push(seen[val]);
                    } else {
                        seen[val] = { r, c };
                    }
                }
            }
        }
        
        // Check columns
        for (let c = 0; c < this.size; c++) {
            const seen = {};
            for (let r = 0; r < this.size; r++) {
                const val = this.state.grid[r][c];
                if (val !== 0) {
                    if (seen[val]) {
                        errors.push({ r, c });
                        errors.push(seen[val]);
                    } else {
                        seen[val] = { r, c };
                    }
                }
            }
        }
        
        // Check 2x2 boxes
        for (let boxRow = 0; boxRow < 2; boxRow++) {
            for (let boxCol = 0; boxCol < 2; boxCol++) {
                const seen = {};
                for (let r = boxRow * 2; r < boxRow * 2 + 2; r++) {
                    for (let c = boxCol * 2; c < boxCol * 2 + 2; c++) {
                        const val = this.state.grid[r][c];
                        if (val !== 0) {
                            if (seen[val]) {
                                errors.push({ r, c });
                                errors.push(seen[val]);
                            } else {
                                seen[val] = { r, c };
                            }
                        }
                    }
                }
            }
        }
        
        return errors;
    }

    checkComplete() {
        // Check if grid is full and matches solution
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.state.grid[r][c] !== this.state.solution[r][c]) {
                    return false;
                }
            }
        }
        return true;
    }

    checkGameOver() {
        if (this.state.completed) {
            return { 
                gameOver: true, 
                winner: this.currentPlayer, 
                reason: 'Puzzle solved!' 
            };
        }
        return { gameOver: false };
    }

    getValidMoves() {
        const moves = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.state.fixed[r][c]) {
                    const correctValue = this.state.solution[r][c];
                    moves.push({ row: r, col: c, value: correctValue });
                }
            }
        }
        return moves;
    }

    getHint() {
        // Find an empty or incorrect cell and reveal it
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.state.fixed[r][c] && 
                    this.state.grid[r][c] !== this.state.solution[r][c]) {
                    return { row: r, col: c, value: this.state.solution[r][c] };
                }
            }
        }
        return null;
    }

    render(ctx, boardElement) {
        if (boardElement) {
            this.renderDOM(boardElement);
        }
    }

    renderDOM(boardElement) {
        boardElement.className = 'sudoku-board';
        
        const errorSet = new Set(this.state.errors.map(e => `${e.r},${e.c}`));
        
        let html = `
            <div class="sudoku-header">
                <div class="sudoku-scores">
                    <span class="sudoku-score sudoku-score--p1">P1: ${this.state.scores[1]}</span>
                    <span class="sudoku-score sudoku-score--p2">P2: ${this.state.scores[2]}</span>
                </div>
                <div class="sudoku-moves">Moves: ${this.state.moveCount}</div>
            </div>
            
            <div class="sudoku-grid">
        `;
        
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const value = this.state.grid[r][c];
                const isFixed = this.state.fixed[r][c];
                const isSelected = this.state.selectedCell?.r === r && 
                                   this.state.selectedCell?.c === c;
                const hasError = errorSet.has(`${r},${c}`);
                
                const cellClass = [
                    'sudoku-cell',
                    isFixed ? 'sudoku-cell--fixed' : '',
                    isSelected ? 'sudoku-cell--selected' : '',
                    hasError ? 'sudoku-cell--error' : '',
                    r === 1 ? 'sudoku-cell--border-bottom' : '',
                    c === 1 ? 'sudoku-cell--border-right' : ''
                ].filter(Boolean).join(' ');
                
                html += `
                    <div class="${cellClass}" data-row="${r}" data-col="${c}">
                        ${value || ''}
                    </div>
                `;
            }
        }
        
        html += '</div>';
        
        // Number input buttons
        html += '<div class="sudoku-input-buttons">';
        for (let i = 1; i <= this.size; i++) {
            html += `<button class="sudoku-input-btn" data-value="${i}">${i}</button>`;
        }
        html += `<button class="sudoku-input-btn sudoku-input-btn--clear" data-value="0">✕</button>`;
        html += '</div>';
        
        // Actions
        html += `
            <div class="sudoku-actions">
                <button class="sudoku-hint btn btn--secondary">Get Hint</button>
                <button class="sudoku-new btn btn--secondary">New Puzzle</button>
            </div>
        `;
        
        if (this.state.completed) {
            html += `<div class="sudoku-success">Puzzle Solved! 🎉</div>`;
        }
        
        boardElement.innerHTML = html;
        
        // Cell click handlers
        boardElement.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                if (!this.state.fixed[row][col]) {
                    this.state.selectedCell = { r: row, c: col };
                    this.eventBus.emit('game:stateUpdate', this.getState());
                }
            });
        });
        
        // Number button handlers
        boardElement.querySelectorAll('.sudoku-input-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const value = parseInt(btn.dataset.value);
                
                if (this.state.selectedCell) {
                    const { r, c } = this.state.selectedCell;
                    const moveData = { row: r, col: c, value, player: this.currentPlayer };
                    
                    if (this.validateMove(moveData).valid) {
                        this.eventBus.emit('game:move', moveData);
                    }
                }
            });
        });
        
        // Hint button
        boardElement.querySelector('.sudoku-hint').addEventListener('click', () => {
            const hint = this.getHint();
            if (hint) {
                this.state.grid[hint.row][hint.col] = hint.value;
                this.state.moveCount++;
                
                if (this.checkComplete()) {
                    this.state.completed = true;
                }
                
                this.eventBus.emit('game:stateUpdate', this.getState());
            }
        });
        
        // New puzzle button
        boardElement.querySelector('.sudoku-new').addEventListener('click', () => {
            const puzzle = this.generatePuzzle();
            this.state.grid = puzzle.grid;
            this.state.solution = puzzle.solution;
            this.state.fixed = puzzle.fixed;
            this.state.selectedCell = null;
            this.state.errors = [];
            this.state.moveCount = 0;
            this.state.completed = false;
            this.eventBus.emit('game:stateUpdate', this.getState());
        });
        
        // Keyboard input
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    handleKeyboard(e) {
        if (!this.state.selectedCell) return;
        
        const { r, c } = this.state.selectedCell;
        
        if (e.key >= '1' && e.key <= '4') {
            const value = parseInt(e.key);
            const moveData = { row: r, col: c, value, player: this.currentPlayer };
            
            if (this.validateMove(moveData).valid) {
                this.eventBus.emit('game:move', moveData);
            }
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            const moveData = { row: r, col: c, value: 0, player: this.currentPlayer };
            
            if (this.validateMove(moveData).valid) {
                this.eventBus.emit('game:move', moveData);
            }
        } else if (e.key === 'ArrowUp' && r > 0) {
            this.state.selectedCell = { r: r - 1, c };
            this.eventBus.emit('game:stateUpdate', this.getState());
        } else if (e.key === 'ArrowDown' && r < this.size - 1) {
            this.state.selectedCell = { r: r + 1, c };
            this.eventBus.emit('game:stateUpdate', this.getState());
        } else if (e.key === 'ArrowLeft' && c > 0) {
            this.state.selectedCell = { r, c: c - 1 };
            this.eventBus.emit('game:stateUpdate', this.getState());
        } else if (e.key === 'ArrowRight' && c < this.size - 1) {
            this.state.selectedCell = { r, c: c + 1 };
            this.eventBus.emit('game:stateUpdate', this.getState());
        }
    }

    getMetadata() {
        return {
            id: 'minisudoku',
            name: 'Mini Sudoku',
            players: 1,
            description: 'Fill the 4×4 grid so each row, column, and 2×2 box contains 1-4.'
        };
    }
}
