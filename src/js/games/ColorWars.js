export class ColorWars {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.grid = [];
        this.currentPlayer = 1; // 1 = Red, 2 = Blue
        this.gameStarted = false;
        this.gridSize = 8;
        this.playerScores = { 1: 0, 2: 0 };
        this.playerFirstMoves = { 1: false, 2: false };
        this.gameEnded = false;
        this.expansionDepth = 0; // Track expansion depth to prevent infinite loops
        this.maxExpansionDepth = 10; // Maximum chain reaction depth

        this.initializeGame();
    }

    async init() {
        this.initializeGame();
    }

    initializeGame() {
        this.createGameBoard();
        this.bindEvents();
        this.initializeGrid();
        this.updateDisplay();
    }

    createGameBoard() {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) return;
        gameBoard.innerHTML = '';

        // Create grid cells and attach click handlers
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Click event uses row/col captured in closure
                cell.addEventListener('click', () => {
                    this.handleCellClick(row, col);
                });

                gameBoard.appendChild(cell);
            }
        }
    }

    initializeGrid() {
        // Create a grid object for every cell (owner: null means empty)
        this.grid = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(null).map(() => ({
                owner: null,
                dots: 0,
                color: 'neutral'
            }))
        );

        this.playerFirstMoves = { 1: false, 2: false };
        this.playerScores = { 1: 0, 2: 0 };
        this.gameEnded = false;
        this.currentPlayer = 1;
        this.updateGridDisplay();
        this.updateDisplay();
    }

    bindEvents() {
        const newBtn = document.getElementById('new-game');
        if (newBtn) newBtn.addEventListener('click', () => this.newGame());

        const resetBtn = document.getElementById('reset-game');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetGame());
    }

    handleCellClick(row, col) {
        if (this.gameEnded) return;

        const cell = this.grid[row][col];

        // First move: place 3 dots anywhere (single click)
        if (!this.playerFirstMoves[this.currentPlayer]) {
            this.placeFirstMove(row, col);
            return;
        }

        // After first move: players can only add dots to their own color
        if (cell && cell.owner === this.currentPlayer) {
            this.placeDot(row, col);
        } else {
            // optional feedback: player clicked an invalid cell
            this.showGameStatus('You can only add dots to your own color.', 'error');
            setTimeout(() => this.clearGameStatus(), 700);
        }
    }

    placeFirstMove(row, col) {
        // put 3 dots in the clicked cell in one go (like your original)
        this.grid[row][col] = {
            owner: this.currentPlayer,
            dots: 3,
            color: this.currentPlayer === 1 ? 'red' : 'blue'
        };

        this.playerScores[this.currentPlayer] += 3;
        this.playerFirstMoves[this.currentPlayer] = true;
        this.switchPlayer();
        this.updateGridDisplay();
    }

    canSpreadToCell(row, col, player) {
        // Check adjacency (used for move-possibility checks, not for clicking)
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (this.isValidPosition(newRow, newCol)) {
                const adjacentCell = this.grid[newRow][newCol];
                if (adjacentCell && adjacentCell.owner === player) {
                    return true;
                }
            }
        }
        return false;
    }

    placeDot(row, col) {
        const cell = this.grid[row][col];
        if (!cell || cell.owner !== this.currentPlayer) return;

        cell.dots++;
        this.playerScores[this.currentPlayer]++;

        // If dots reach 4 or more -> spread (capture) and then reset this cell to 1
        if (cell.dots >= 4) {
            this.expandTerritory(row, col);
            cell.dots = 1; // reset after spreading (keeps at least 1)
        }

        this.updateDisplay();
        this.checkWinCondition();
        this.switchPlayer();
    }

    captureOpponentArea(row, col) {
        // (Kept for compatibility; not used via click anymore)
        const opponentCell = this.grid[row][col];
        if (!opponentCell || opponentCell.owner === this.currentPlayer) return;

        const totalDots = opponentCell.dots + 1;

        opponentCell.owner = this.currentPlayer;
        opponentCell.dots = totalDots;
        opponentCell.color = this.currentPlayer === 1 ? 'red' : 'blue';

        this.playerScores[this.currentPlayer] += totalDots;

        if (totalDots >= 4) {
            this.expandTerritory(row, col);
            opponentCell.dots = 1;
        }

        this.updateDisplay();
        this.checkWinCondition();
        this.switchPlayer();
    }

    expandTerritory(row, col, depth = 0) {
        // Prevent infinite expansion
        if (depth > this.maxExpansionDepth) return;
        
        // Add expanding animation to the current cell
        const currentCellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (currentCellElement) {
            currentCellElement.classList.add('expanding');
            setTimeout(() => {
                currentCellElement.classList.remove('expanding');
            }, 600);
        }
        
        // Spread +1 dot to each neighbor and convert ownership to current player
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const currentPlayer = this.grid[row][col].owner;
        let expanded = false;
        const cellsToExpand = []; // Track cells that need further expansion

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (this.isValidPosition(newRow, newCol)) {
                const targetCell = this.grid[newRow][newCol];

                if (!targetCell || targetCell.owner === null) {
                    // Capturing empty cell: set to 1 dot and assign owner
                    this.grid[newRow][newCol] = {
                        owner: currentPlayer,
                        dots: 1,
                        color: currentPlayer === 1 ? 'red' : 'blue'
                    };
                    this.playerScores[currentPlayer]++;
                    expanded = true;
                } else if (targetCell.owner !== currentPlayer) {
                    // Capturing opponent cell: subtract from opponent's score first
                    this.playerScores[targetCell.owner] -= targetCell.dots;
                    // Then add 1 to existing dots and change owner
                    const totalDots = targetCell.dots + 1;
                    targetCell.owner = currentPlayer;
                    targetCell.dots = totalDots;
                    targetCell.color = currentPlayer === 1 ? 'red' : 'blue';
                    this.playerScores[currentPlayer] += totalDots;
                    expanded = true;

                    // If this captured cell reaches exactly 4 dots, mark for expansion
                    if (totalDots === 4 && depth < this.maxExpansionDepth) {
                        cellsToExpand.push([newRow, newCol]);
                    }
                } else if (targetCell.owner === currentPlayer) {
                    // Adding to own cell: just increment dots and score
                    targetCell.dots++;
                    this.playerScores[currentPlayer]++;
                    expanded = true;

                    // If this cell reaches exactly 4 dots, mark for expansion
                    if (targetCell.dots === 4 && depth < this.maxExpansionDepth) {
                        cellsToExpand.push([newRow, newCol]);
                    }
                }
            }
        }

        if (expanded) {
            this.updateGridDisplay();
            this.updateDisplay();
        }

        // Process chain reactions with delay for visual effect
        if (cellsToExpand.length > 0) {
            // Highlight cells that will expand next
            cellsToExpand.forEach(([expandRow, expandCol]) => {
                const cellElement = document.querySelector(`[data-row="${expandRow}"][data-col="${expandCol}"]`);
                if (cellElement) {
                    cellElement.classList.add('chain-expanding');
                }
            });

            setTimeout(() => {
                for (const [expandRow, expandCol] of cellsToExpand) {
                    this.grid[expandRow][expandCol].dots = 1; // Reset to 1 after marking for expansion
                    // Remove highlighting
                    const cellElement = document.querySelector(`[data-row="${expandRow}"][data-col="${expandCol}"]`);
                    if (cellElement) {
                        cellElement.classList.remove('chain-expanding');
                    }
                }
                this.updateGridDisplay();
                
                // Process each expansion with staggered delays
                cellsToExpand.forEach(([expandRow, expandCol], index) => {
                    setTimeout(() => {
                        this.expandTerritory(expandRow, expandCol, depth + 1);
                    }, index * 300); // 300ms delay between each expansion
                });
            }, 500); // Initial 500ms delay before starting chain reactions
        }
    }

    expandFromCell(row, col) {
        // This method is now deprecated - we use expandTerritory for all expansions
        // to ensure consistent chain reaction behavior
        this.expandTerritory(row, col);
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
    }

    updateGridDisplay() {
        const cells = document.querySelectorAll('.grid-cell');

        cells.forEach((cellEl, index) => {
            const row = Math.floor(index / this.gridSize);
            const col = index % this.gridSize;
            const gridCell = this.grid[row][col];

            // Reset classes/content
            cellEl.className = 'grid-cell';

            if (gridCell && gridCell.owner) {
                // color class
                cellEl.classList.add(gridCell.color);

                // Clickable logic:
                // - If it's the player's FIRST move: all cells are clickable
                // - Otherwise: only cells owned by current player are clickable
                if (!this.playerFirstMoves[this.currentPlayer]) {
                    if (this.currentPlayer === 1) cellEl.classList.add('clickable-red');
                    else cellEl.classList.add('clickable-blue');
                } else {
                    if (gridCell.owner === this.currentPlayer) {
                        if (this.currentPlayer === 1) cellEl.classList.add('clickable-red');
                        else cellEl.classList.add('clickable-blue');
                    } else {
                        cellEl.classList.add('not-clickable');
                    }
                }

                // draw dots inside cell
                cellEl.innerHTML = '';
                for (let i = 0; i < gridCell.dots; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'dot';
                    cellEl.appendChild(dot);
                }
            } else {
                // empty cell
                if (!this.playerFirstMoves[this.currentPlayer]) {
                    // clickable during the player's first move
                    if (this.currentPlayer === 1) cellEl.classList.add('clickable-red');
                    else cellEl.classList.add('clickable-blue');
                } else {
                    cellEl.classList.add('not-clickable');
                }
                cellEl.innerHTML = '';
            }
        });
    }

    checkWinCondition() {
        let redCount = 0;
        let blueCount = 0;
        let emptyCount = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell && cell.owner) {
                    if (cell.owner === 1) redCount++;
                    else blueCount++;
                } else {
                    emptyCount++;
                }
            }
        }

        const canRedMove = this.canPlayerMove(1);
        const canBlueMove = this.canPlayerMove(2);

        if (!canRedMove && !canBlueMove) {
            if (redCount > blueCount) this.endGame(1);
            else if (blueCount > redCount) this.endGame(2);
            else this.endGame('tie');
            return;
        }

        if (!canRedMove && canBlueMove) {
            this.endGame(2);
            return;
        }

        if (!canBlueMove && canRedMove) {
            this.endGame(1);
            return;
        }

        if (emptyCount === 0) {
            if (redCount > blueCount) this.endGame(1);
            else if (blueCount > redCount) this.endGame(2);
            else this.endGame('tie');
        }
    }

    canPlayerMove(player) {
        // Can add dot in own area?
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell && cell.owner === player && cell.dots < 4) {
                    return true;
                }
            }
        }

        // Can capture opponent area by spreading (i.e., opponent cell adjacent to your territory)
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell && cell.owner !== null && cell.owner !== player) {
                    if (this.canSpreadToCell(row, col, player)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    endGame(winner) {
        this.gameEnded = true;

        const popup = document.createElement('div');
        popup.className = 'winner-popup';

        let winnerText = '';
        if (winner === 1) winnerText = '🔴 RED WINS! 🔴';
        else if (winner === 2) winnerText = '🔵 BLUE WINS! 🔵';
        else winnerText = '🤝 IT\'S A TIE! 🤝';

        popup.innerHTML = `
            <div class="popup-content">
                <h2>${winnerText}</h2>
                <div class="final-scores">
                    <div class="score-item">
                        <span class="player-name">🔴 Red:</span>
                        <span class="score-value">${this.playerScores[1]}</span>
                    </div>
                    <div class="score-item">
                        <span class="player-name">🔵 Blue:</span>
                        <span class="score-value">${this.playerScores[2]}</span>
                    </div>
                </div>
                <button class="reset-btn" onclick="location.reload()">Play Again</button>
            </div>
        `;

        document.body.appendChild(popup);
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateDisplay();
    }

    newGame() {
        this.initializeGrid();
        this.currentPlayer = 1;
        this.gameStarted = false;
        this.playerScores = { 1: 0, 2: 0 };
        this.clearGameStatus();
        this.updateDisplay();
    }

    resetGame() {
        this.initializeGrid();
        this.currentPlayer = 1;
        this.gameStarted = false;
        this.playerScores = { 1: 0, 2: 0 };
        this.clearGameStatus();
        this.updateDisplay();
    }

    updateDisplay() {
        // Update scores (if elements exist)
        const s1 = document.getElementById('score-1');
        const s2 = document.getElementById('score-2');
        if (s1) s1.textContent = this.playerScores[1];
        if (s2) s2.textContent = this.playerScores[2];

        // Update turn indicator
        const turnIndicator = document.getElementById('turn-indicator');
        if (turnIndicator) {
            if (!this.playerFirstMoves[this.currentPlayer]) {
                turnIndicator.textContent = `🔴 Player ${this.currentPlayer === 1 ? 'Red' : 'Blue'}: Place 3 dots anywhere!`;
            } else {
                if (this.currentPlayer === 1) {
                    turnIndicator.textContent = `🔴 Red's Turn: Add dots to RED areas only (capture only via spread)`;
                } else {
                    turnIndicator.textContent = `🔵 Blue's Turn: Add dots to BLUE areas only (capture only via spread)`;
                }
            }
        }

        // Active player styling if you have .player elements
        document.querySelectorAll('.player').forEach(player => player.classList.remove('active'));
        const activePlayer = document.querySelector(`.player-${this.currentPlayer}`);
        if (activePlayer) activePlayer.classList.add('active');

        // Update grid visuals
        this.updateGridDisplay();
    }

    showGameStatus(message, type = '') {
        const gameStatus = document.getElementById('game-status');
        if (!gameStatus) return;
        gameStatus.textContent = message;
        gameStatus.className = `game-status ${type}`;
    }

    clearGameStatus() {
        const gameStatus = document.getElementById('game-status');
        if (!gameStatus) return;
        gameStatus.textContent = '';
        gameStatus.className = 'game-status';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ColorWars();
});