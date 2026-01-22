/**
 * Dots and Boxes - Classic Pen and Paper Game
 * Draw lines between dots to complete boxes
 */

import { BaseGame } from './BaseGame.js';

export class DotsAndBoxes extends BaseGame {
    constructor(eventBus) {
        super(eventBus);
        this.gridSize = 5; // 5x5 dots = 4x4 boxes
    }

    createInitialState() {
        const boxes = this.gridSize - 1;
        
        // Horizontal lines: (gridSize-1) rows, gridSize columns
        const horizontalLines = [];
        for (let r = 0; r < this.gridSize; r++) {
            horizontalLines.push(Array(boxes).fill(0));
        }
        
        // Vertical lines: gridSize rows, (gridSize-1) columns
        const verticalLines = [];
        for (let r = 0; r < boxes; r++) {
            verticalLines.push(Array(this.gridSize).fill(0));
        }
        
        // Box ownership
        const boxOwners = [];
        for (let r = 0; r < boxes; r++) {
            boxOwners.push(Array(boxes).fill(0));
        }
        
        return {
            horizontalLines,
            verticalLines,
            boxOwners,
            scores: { 1: 0, 2: 0 }
        };
    }

    validateMove(moveData) {
        const { type, row, col } = moveData;
        
        if (type === 'horizontal') {
            if (row < 0 || row >= this.gridSize || 
                col < 0 || col >= this.gridSize - 1) {
                return { valid: false, reason: 'Out of bounds' };
            }
            if (this.state.horizontalLines[row][col] !== 0) {
                return { valid: false, reason: 'Line already drawn' };
            }
        } else if (type === 'vertical') {
            if (row < 0 || row >= this.gridSize - 1 || 
                col < 0 || col >= this.gridSize) {
                return { valid: false, reason: 'Out of bounds' };
            }
            if (this.state.verticalLines[row][col] !== 0) {
                return { valid: false, reason: 'Line already drawn' };
            }
        } else {
            return { valid: false, reason: 'Invalid line type' };
        }
        
        return { valid: true };
    }

    applyMove(moveData) {
        const { type, row, col } = moveData;
        
        if (type === 'horizontal') {
            this.state.horizontalLines[row][col] = this.currentPlayer;
        } else {
            this.state.verticalLines[row][col] = this.currentPlayer;
        }
        
        // Check for completed boxes
        this.lastMoveCompletedBox = this.checkCompletedBoxes();
    }

    checkCompletedBoxes() {
        let completed = false;
        const boxes = this.gridSize - 1;
        
        for (let r = 0; r < boxes; r++) {
            for (let c = 0; c < boxes; c++) {
                if (this.state.boxOwners[r][c] === 0) {
                    // Check if box is complete
                    const top = this.state.horizontalLines[r][c];
                    const bottom = this.state.horizontalLines[r + 1][c];
                    const left = this.state.verticalLines[r][c];
                    const right = this.state.verticalLines[r][c + 1];
                    
                    if (top && bottom && left && right) {
                        this.state.boxOwners[r][c] = this.currentPlayer;
                        this.state.scores[this.currentPlayer]++;
                        completed = true;
                    }
                }
            }
        }
        
        return completed;
    }

    checkExtraTurn(moveData) {
        return this.lastMoveCompletedBox;
    }

    checkGameOver() {
        const boxes = this.gridSize - 1;
        const totalBoxes = boxes * boxes;
        const claimed = this.state.scores[1] + this.state.scores[2];
        
        if (claimed === totalBoxes) {
            let winner = null;
            if (this.state.scores[1] > this.state.scores[2]) {
                winner = 1;
            } else if (this.state.scores[2] > this.state.scores[1]) {
                winner = 2;
            }
            return { 
                gameOver: true, 
                winner, 
                reason: winner ? `Player ${winner} wins with ${this.state.scores[winner]} boxes` : 'Draw'
            };
        }
        
        return { gameOver: false };
    }

    getValidMoves() {
        const moves = [];
        
        // Horizontal lines
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize - 1; c++) {
                if (this.state.horizontalLines[r][c] === 0) {
                    moves.push({ type: 'horizontal', row: r, col: c });
                }
            }
        }
        
        // Vertical lines
        for (let r = 0; r < this.gridSize - 1; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.state.verticalLines[r][c] === 0) {
                    moves.push({ type: 'vertical', row: r, col: c });
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
        boardElement.className = 'dotsboxes-board';
        
        const cellSize = 60;
        const dotSize = 12;
        const lineWidth = 8;
        
        let html = `<div class="dotsboxes-scores">
            <span class="dotsboxes-score dotsboxes-score--p1">P1: ${this.state.scores[1]}</span>
            <span class="dotsboxes-score dotsboxes-score--p2">P2: ${this.state.scores[2]}</span>
        </div>`;
        
        html += '<div class="dotsboxes-grid">';
        
        for (let r = 0; r < this.gridSize; r++) {
            // Row with dots and horizontal lines
            html += '<div class="dotsboxes-row">';
            
            for (let c = 0; c < this.gridSize; c++) {
                // Dot
                html += `<div class="dotsboxes-dot"></div>`;
                
                // Horizontal line (not after last dot)
                if (c < this.gridSize - 1) {
                    const lineVal = this.state.horizontalLines[r][c];
                    const lineClass = lineVal ? `dotsboxes-line--p${lineVal}` : 'dotsboxes-line--empty';
                    html += `
                        <div class="dotsboxes-hline ${lineClass}" 
                             data-type="horizontal" data-row="${r}" data-col="${c}">
                        </div>
                    `;
                }
            }
            
            html += '</div>';
            
            // Row with vertical lines and boxes (not after last row of dots)
            if (r < this.gridSize - 1) {
                html += '<div class="dotsboxes-row dotsboxes-row--between">';
                
                for (let c = 0; c < this.gridSize; c++) {
                    // Vertical line
                    const lineVal = this.state.verticalLines[r][c];
                    const lineClass = lineVal ? `dotsboxes-line--p${lineVal}` : 'dotsboxes-line--empty';
                    html += `
                        <div class="dotsboxes-vline ${lineClass}" 
                             data-type="vertical" data-row="${r}" data-col="${c}">
                        </div>
                    `;
                    
                    // Box (not after last vertical line)
                    if (c < this.gridSize - 1) {
                        const owner = this.state.boxOwners[r][c];
                        const boxClass = owner ? `dotsboxes-box--p${owner}` : '';
                        html += `<div class="dotsboxes-box ${boxClass}"></div>`;
                    }
                }
                
                html += '</div>';
            }
        }
        
        html += '</div>';
        
        boardElement.innerHTML = html;
        
        // Add line click handlers
        boardElement.querySelectorAll('.dotsboxes-hline, .dotsboxes-vline').forEach(line => {
            line.addEventListener('click', () => {
                const type = line.dataset.type;
                const row = parseInt(line.dataset.row);
                const col = parseInt(line.dataset.col);
                
                const moveData = { type, row, col, player: this.currentPlayer };
                if (this.validateMove(moveData).valid) {
                    this.eventBus.emit('game:move', moveData);
                }
            });
        });
    }

    getMetadata() {
        return {
            id: 'dotsandboxes',
            name: 'Dots and Boxes',
            players: 2,
            description: 'Draw lines to complete boxes. Complete a box to score and go again!'
        };
    }
}
