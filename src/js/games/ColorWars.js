/**
 * ColorWars - Integrated from my_games/colorWars
 * Territory control game with chain reactions
 */
export class ColorWars {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.boardElement = null;
        this.sessionStartTime = null;
        this.moveCount = 0;
        this.grid = [];
        this.currentPlayer = 1;
        this.gameStarted = false;
        this.gridSize = 8;
        this.playerScores = { 1: 0, 2: 0 };
        this.playerFirstMoves = { 1: false, 2: false };
        this.gameEnded = false;
        this.maxExpansionDepth = 10;
        this._expanding = false;
        this._pendingExpansions = 0;
        this._afterExpansionCallback = null;
    }

    async init() {
        this.sessionStartTime = Date.now();
        this.moveCount = 0;
        this.gameEnded = false;
        this.currentPlayer = 1;
        this.playerScores = { 1: 0, 2: 0 };
        this.playerFirstMoves = { 1: false, 2: false };
        this._initializeGrid();
        console.log('ColorWars initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) this.boardElement = boardElement;
        if (!this.boardElement) return;

        // If wrapper exists, just update display and return
        if (this.boardElement.querySelector('.cw-wrapper')) {
            this._updateDisplay();
            return;
        }

        this.boardElement.innerHTML = '';
        this._addStyles();

        this.boardElement.innerHTML = `
            <div class="cw-wrapper">
                <div class="cw-header">
                    <div class="cw-player cw-p1 active" id="cw-p1">
                        <span>🔴 Red</span>
                        <span class="cw-score" id="cw-score-1">0</span>
                    </div>
                    <div class="cw-turn" id="cw-turn">Red: Place 3 dots anywhere!</div>
                    <div class="cw-player cw-p2" id="cw-p2">
                        <span>🔵 Blue</span>
                        <span class="cw-score" id="cw-score-2">0</span>
                    </div>
                </div>
                <div class="cw-board" id="cw-board"></div>
                <div class="cw-controls">
                    <button id="cw-new-game" class="cw-btn">New Game</button>
                    <button id="cw-reset" class="cw-btn cw-btn-secondary">Reset</button>
                </div>
                <div class="cw-status" id="cw-status"></div>
            </div>
        `;

        this._setupDOMListeners();
    }

    _addStyles() {
        if (document.getElementById('cw-styles')) return;
        const style = document.createElement('style');
        style.id = 'cw-styles';
        style.textContent = `
            .cw-wrapper { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; font-family: inherit; }
            .cw-header { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 500px; }
            .cw-player { display: flex; flex-direction: column; align-items: center; padding: 0.75rem 1.25rem; border-radius: 12px; background: #f0f0f0; transition: all 0.3s; opacity: 0.6; }
            .cw-player.active { opacity: 1; transform: scale(1.05); }
            .cw-p1.active { background: linear-gradient(135deg, #ff6b6b, #c0392b); color: white; }
            .cw-p2.active { background: linear-gradient(135deg, #74b9ff, #2980b9); color: white; }
            .cw-score { font-size: 1.5rem; font-weight: 700; }
            .cw-turn { font-weight: 600; font-size: 0.85rem; text-align: center; max-width: 160px; }
            .cw-board { display: grid; grid-template-columns: repeat(8, 1fr); gap: 3px; width: min(480px, 90vw); }
            .cw-cell { aspect-ratio: 1; border-radius: 6px; background: #e2e8f0; cursor: pointer; transition: all 0.2s; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 2px; padding: 3px; position: relative; }
            .cw-cell.red { background: linear-gradient(135deg, #ff6b6b, #c0392b); }
            .cw-cell.blue { background: linear-gradient(135deg, #74b9ff, #2980b9); }
            .cw-cell.clickable-red { cursor: pointer; outline: 2px solid rgba(192,57,43,0.5); }
            .cw-cell.clickable-blue { cursor: pointer; outline: 2px solid rgba(41,128,185,0.5); }
            .cw-cell.not-clickable { cursor: not-allowed; opacity: 0.7; }
            .cw-cell.expanding { animation: cw-expand 0.6s ease; }
            @keyframes cw-expand { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
            .cw-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.8); }
            .cw-controls { display: flex; gap: 1rem; }
            .cw-btn { padding: 0.5rem 1.5rem; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: 600; cursor: pointer; font-family: inherit; }
            .cw-btn-secondary { background: #e2e8f0; color: #4a5568; }
            .cw-status { font-weight: 600; min-height: 1.5rem; text-align: center; color: #4a5568; }
        `;
        document.head.appendChild(style);
    }

    _setupDOMListeners() {
        const boardEl = this.boardElement.querySelector('#cw-board');
        const newGameBtn = this.boardElement.querySelector('#cw-new-game');
        const resetBtn = this.boardElement.querySelector('#cw-reset');

        newGameBtn.addEventListener('click', () => {
             this._initializeGrid();
             this._updateDisplay();
        });
        resetBtn.addEventListener('click', () => {
             this._initializeGrid();
             this._updateDisplay();
        });

        // Build cells
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cw-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this._handleCellClick(row, col));
                boardEl.appendChild(cell);
            }
        }

        this._updateDisplay();
    }

    _initializeGrid() {
        this.grid = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(null).map(() => ({ owner: null, dots: 0, color: 'neutral' }))
        );
        this.playerFirstMoves = { 1: false, 2: false };
        this.playerScores = { 1: 0, 2: 0 };
        this.gameEnded = false;
        this.currentPlayer = 1;
        this.moveCount = 0;
        this.sessionStartTime = Date.now();
    }

    _handleCellClick(row, col) {
        if (this.gameEnded) return;
        const cell = this.grid[row][col];
        if (!this.playerFirstMoves[this.currentPlayer]) {
            this._placeFirstMove(row, col);
        } else if (cell && cell.owner === this.currentPlayer) {
            this._placeDot(row, col);
        } else {
            this._setStatus('You can only add dots to your own color.');
            setTimeout(() => this._setStatus(''), 700);
        }
    }

    _placeFirstMove(row, col) {
        this.grid[row][col] = { owner: this.currentPlayer, dots: 3, color: this.currentPlayer === 1 ? 'red' : 'blue' };
        this.playerScores[this.currentPlayer] += 3;
        this.playerFirstMoves[this.currentPlayer] = true;
        this.moveCount++;
        this._switchPlayer();
        this._updateGridDisplay();
    }

    _placeDot(row, col) {
        const cell = this.grid[row][col];
        if (!cell || cell.owner !== this.currentPlayer) return;
        if (this._expanding) return; // Block input during chain reaction
        cell.dots++;
        this.playerScores[this.currentPlayer]++;
        this.moveCount++;
        if (cell.dots >= 4) {
            this._expanding = true;
            this._expandTerritory(row, col);
            cell.dots = 1;
            // Delay win check and turn switch until chain reactions finish
            this._scheduleAfterExpansion(() => {
                this._expanding = false;
                this._updateDisplay();
                this._checkWinCondition();
                this._switchPlayer();
            });
        } else {
            this._updateDisplay();
            this._checkWinCondition();
            this._switchPlayer();
        }
    }

    _expandTerritory(row, col, depth = 0) {
        if (depth > this.maxExpansionDepth) {
            this._pendingExpansions--;
            this._tryAfterExpansion();
            return;
        }
        const directions = [[-1,0],[1,0],[0,-1],[0,1]];
        const currentPlayer = this.grid[row][col].owner;
        const cellsToExpand = [];

        for (const [dr, dc] of directions) {
            const nr = row + dr, nc = col + dc;
            if (nr < 0 || nr >= this.gridSize || nc < 0 || nc >= this.gridSize) continue;
            const target = this.grid[nr][nc];
            if (!target || target.owner === null) {
                this.grid[nr][nc] = { owner: currentPlayer, dots: 1, color: currentPlayer === 1 ? 'red' : 'blue' };
                this.playerScores[currentPlayer]++;
            } else if (target.owner !== currentPlayer) {
                this.playerScores[target.owner] -= target.dots;
                const total = target.dots + 1;
                target.owner = currentPlayer; target.dots = total; target.color = currentPlayer === 1 ? 'red' : 'blue';
                this.playerScores[currentPlayer] += total;
                if (total === 4 && depth < this.maxExpansionDepth) cellsToExpand.push([nr, nc]);
            } else {
                target.dots++;
                this.playerScores[currentPlayer]++;
                if (target.dots === 4 && depth < this.maxExpansionDepth) cellsToExpand.push([nr, nc]);
            }
        }

        this._updateGridDisplay();
        this._updateDisplay();

        if (cellsToExpand.length > 0) {
            // Track how many new expansions we're scheduling (replace current one)
            this._pendingExpansions += cellsToExpand.length - 1; // -1 because current one is being consumed
            setTimeout(() => {
                for (const [er, ec] of cellsToExpand) this.grid[er][ec].dots = 1;
                this._updateGridDisplay();
                cellsToExpand.forEach(([er, ec], i) => {
                    setTimeout(() => this._expandTerritory(er, ec, depth + 1), i * 300);
                });
            }, 500);
        } else {
            // This branch is a leaf — decrement pending counter
            this._pendingExpansions--;
            this._tryAfterExpansion();
        }
    }

    /**
     * Schedule a callback to run after all chain-reaction expansions complete.
     */
    _scheduleAfterExpansion(callback) {
        this._pendingExpansions = 1; // Start with 1 for the initial expansion
        this._afterExpansionCallback = callback;
    }

    _tryAfterExpansion() {
        if (this._pendingExpansions <= 0 && this._afterExpansionCallback) {
            const cb = this._afterExpansionCallback;
            this._afterExpansionCallback = null;
            cb();
        }
    }

    _checkWinCondition() {
        let red = 0, blue = 0, empty = 0;
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = this.grid[r][c];
                if (cell && cell.owner) { if (cell.owner === 1) red++; else blue++; }
                else empty++;
            }
        }
        const canRed = this._canPlayerMove(1), canBlue = this._canPlayerMove(2);
        if (!canRed && !canBlue) {
            if (red > blue) this._endGame(1);
            else if (blue > red) this._endGame(2);
            else this._endGame('tie');
        } else if (!canRed && canBlue) this._endGame(2);
        else if (!canBlue && canRed) this._endGame(1);
        else if (empty === 0) {
            if (red > blue) this._endGame(1);
            else if (blue > red) this._endGame(2);
            else this._endGame('tie');
        }
    }

    _canPlayerMove(player) {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = this.grid[r][c];
                if (cell && cell.owner === player && cell.dots < 4) return true;
            }
        }
        return false;
    }

    _endGame(winner) {
        this.gameEnded = true;
        const text = winner === 1 ? '🔴 Red Wins!' : winner === 2 ? '🔵 Blue Wins!' : "🤝 It's a Tie!";
        this._setStatus(text);
        const duration = Date.now() - (this.sessionStartTime || Date.now());
        this.eventBus?.emit('game:end', {
            gameId: 'colorwars',
            winner,
            winReason: text,
            moveCount: this.moveCount,
            sessionDuration: duration,
            scores: { 1: this.playerScores[1], 2: this.playerScores[2] }
        });
    }

    _switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this._updateDisplay();
    }

    _updateGridDisplay() {
        if (!this.boardElement) return;
        const cells = this.boardElement.querySelectorAll('.cw-cell');
        cells.forEach((cellEl, index) => {
            const row = Math.floor(index / this.gridSize);
            const col = index % this.gridSize;
            const gridCell = this.grid[row][col];
            cellEl.className = 'cw-cell';
            cellEl.innerHTML = '';
            if (gridCell && gridCell.owner) {
                cellEl.classList.add(gridCell.color);
                if (!this.playerFirstMoves[this.currentPlayer]) {
                    cellEl.classList.add(this.currentPlayer === 1 ? 'clickable-red' : 'clickable-blue');
                } else {
                    if (gridCell.owner === this.currentPlayer) cellEl.classList.add(this.currentPlayer === 1 ? 'clickable-red' : 'clickable-blue');
                    else cellEl.classList.add('not-clickable');
                }
                for (let i = 0; i < gridCell.dots; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'cw-dot';
                    cellEl.appendChild(dot);
                }
            } else {
                if (!this.playerFirstMoves[this.currentPlayer]) {
                    cellEl.classList.add(this.currentPlayer === 1 ? 'clickable-red' : 'clickable-blue');
                } else {
                    cellEl.classList.add('not-clickable');
                }
            }
        });
    }

    _updateDisplay() {
        if (!this.boardElement) return;
        const s1 = this.boardElement.querySelector('#cw-score-1');
        const s2 = this.boardElement.querySelector('#cw-score-2');
        const turn = this.boardElement.querySelector('#cw-turn');
        const p1 = this.boardElement.querySelector('#cw-p1');
        const p2 = this.boardElement.querySelector('#cw-p2');
        if (s1) s1.textContent = this.playerScores[1];
        if (s2) s2.textContent = this.playerScores[2];
        if (turn) {
            if (!this.playerFirstMoves[this.currentPlayer]) {
                turn.textContent = `${this.currentPlayer === 1 ? '🔴 Red' : '🔵 Blue'}: Place 3 dots anywhere!`;
            } else {
                turn.textContent = `${this.currentPlayer === 1 ? '🔴 Red' : '🔵 Blue'}: Add dots to your color`;
            }
        }
        if (p1) p1.classList.toggle('active', this.currentPlayer === 1);
        if (p2) p2.classList.toggle('active', this.currentPlayer === 2);
        this._updateGridDisplay();
    }

    _setStatus(msg) {
        const el = this.boardElement?.querySelector('#cw-status');
        if (el) el.textContent = msg;
    }

    getState() { return { currentPlayer: this.currentPlayer, gameActive: !this.gameEnded }; }
    makeMove() { return { valid: false }; }
    cleanup() { if (this.boardElement) this.boardElement.innerHTML = ''; }
}