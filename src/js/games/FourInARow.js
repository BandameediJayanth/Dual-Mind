/**
 * FourInARow - Integrated from my_games/fourinarow
 * Drop pieces to connect four in any direction
 */
export class FourInARow {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.boardElement = null;
        this.sessionStartTime = null;
        this.moveCount = 0;
        // Internal game state
        this.rows = 6;
        this.cols = 7;
        this.board = [];
        this.currentPlayer = 'red';
        this.gameActive = true;
        this.scores = { red: 0, blue: 0 };
    }

    async init() {
        this.sessionStartTime = Date.now();
        this.moveCount = 0;
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(''));
        this.currentPlayer = 'red';
        this.gameActive = true;
        console.log('FourInARow initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) this.boardElement = boardElement;
        if (!this.boardElement) return;

        // If wrapper exists, return
        if (this.boardElement.querySelector('.fiar-wrapper')) return;

        this.boardElement.innerHTML = '';
        this._addStyles();

        this.boardElement.innerHTML = `
            <div class="fiar-wrapper">
                <div class="fiar-header">
                    <div class="fiar-player-info">
                        <div class="fiar-token red"></div>
                        <span>Player 1 (Red)</span>
                        <span class="fiar-score" id="fiar-score-red">${this.scores.red}</span>
                    </div>
                    <div class="fiar-turn" id="fiar-turn">Red's Turn</div>
                    <div class="fiar-player-info">
                        <div class="fiar-token blue"></div>
                        <span>Player 2 (Blue)</span>
                        <span class="fiar-score" id="fiar-score-blue">${this.scores.blue}</span>
                    </div>
                </div>
                <div class="fiar-board" id="fiar-board"></div>
                <div class="fiar-controls">
                    <button id="fiar-reset" class="fiar-btn">New Game</button>
                </div>
                <div class="fiar-status hidden" id="fiar-status"></div>
            </div>
        `;

        this._buildBoard();
        this._bindEvents();
    }

    _addStyles() {
        if (document.getElementById('fiar-styles')) return;
        const style = document.createElement('style');
        style.id = 'fiar-styles';
        style.textContent = `
            .fiar-wrapper { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; font-family: inherit; }
            .fiar-header { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 500px; }
            .fiar-player-info { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
            .fiar-token { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.3); }
            .fiar-token.red { background: radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b); }
            .fiar-token.blue { background: radial-gradient(circle at 35% 35%, #74b9ff, #2980b9); }
            .fiar-score { background: #f0f0f0; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; }
            .fiar-turn { font-weight: 700; font-size: 1rem; }
            .fiar-board { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; background: #2c3e50; padding: 12px; border-radius: 12px; width: min(500px, 95vw); }
            .fiar-cell { aspect-ratio: 1; border-radius: 50%; background: #ecf0f1; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
            .fiar-cell:hover { background: #bdc3c7; }
            .fiar-cell.red { background: radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b); cursor: default; }
            .fiar-cell.blue { background: radial-gradient(circle at 35% 35%, #74b9ff, #2980b9); cursor: default; }
            .fiar-cell.winning { animation: fiar-pulse 0.6s infinite alternate; }
            @keyframes fiar-pulse { from { box-shadow: 0 0 0 0 gold; } to { box-shadow: 0 0 0 6px gold; } }
            .fiar-controls { display: flex; gap: 1rem; }
            .fiar-btn { padding: 0.5rem 1.5rem; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: 600; cursor: pointer; font-family: inherit; }
            .fiar-status { padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 700; font-size: 1.1rem; background: linear-gradient(135deg, #48bb78, #38a169); color: white; }
            .fiar-status.hidden { display: none; }
        `;
        document.head.appendChild(style);
    }

    _buildBoard() {
        const boardEl = this.boardElement.querySelector('#fiar-board');
        boardEl.innerHTML = '';
        // Render top row first (visual top = row 5 in data)
        for (let row = this.rows - 1; row >= 0; row--) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'fiar-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                const val = this.board[row][col];
                if (val) cell.classList.add(val);
                boardEl.appendChild(cell);
            }
        }
    }

    _bindEvents() {
        const boardEl = this.boardElement.querySelector('#fiar-board');
        boardEl.addEventListener('click', (e) => {
            const cell = e.target.closest('.fiar-cell');
            if (!cell || !this.gameActive) return;
            const col = parseInt(cell.dataset.col);
            this._handleColClick(col);
        });
        this.boardElement.querySelector('#fiar-reset').addEventListener('click', () => this._resetGame());
    }

    _handleColClick(col) {
        const row = this._getLowestEmptyRow(col);
        if (row === -1) return;

        // Calculate decision time
        const decisionTime = this.lastMoveTime ? Date.now() - this.lastMoveTime : Date.now() - (this.sessionStartTime || Date.now());
        this.lastMoveTime = Date.now();

        this.board[row][col] = this.currentPlayer;
        this.moveCount++;

        this.eventBus?.emit('game:move', {
            gameId: 'fourinrow',
            player: this.currentPlayer === 'red' ? 1 : 2,
            position: { row, col },
            timestamp: Date.now(),
            decisionTime: decisionTime
        });

        if (this._checkWin(row, col)) {
            this._updateBoard();
            this._highlightWin(row, col);
            this._endGame('win');
        } else if (this._checkDraw()) {
            this._updateBoard();
            this._endGame('draw');
        } else {
            this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
            this._updateBoard();
            this._updateTurn();
        }
    }

    _getLowestEmptyRow(col) {
        for (let row = 0; row < this.rows; row++) {
            if (this.board[row][col] === '') return row;
        }
        return -1;
    }

    _updateBoard() {
        const cells = this.boardElement.querySelectorAll('.fiar-cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            cell.classList.remove('red', 'blue');
            if (this.board[row][col]) cell.classList.add(this.board[row][col]);
        });
    }

    _updateTurn() {
        const turnEl = this.boardElement.querySelector('#fiar-turn');
        if (turnEl) turnEl.textContent = this.currentPlayer === 'red' ? "Red's Turn" : "Blue's Turn";
    }

    _checkWin(row, col) {
        const player = this.board[row][col];
        return this._checkDir(row, col, 0, 1, player) ||
               this._checkDir(row, col, 1, 0, player) ||
               this._checkDir(row, col, 1, 1, player) ||
               this._checkDir(row, col, 1, -1, player);
    }

    _checkDir(row, col, dr, dc, player) {
        let count = 1;
        for (let i = 1; i < 4; i++) {
            const r = row + i*dr, c = col + i*dc;
            if (r < 0 || r >= this.rows || c < 0 || c >= this.cols || this.board[r][c] !== player) break;
            count++;
        }
        for (let i = 1; i < 4; i++) {
            const r = row - i*dr, c = col - i*dc;
            if (r < 0 || r >= this.rows || c < 0 || c >= this.cols || this.board[r][c] !== player) break;
            count++;
        }
        return count >= 4;
    }

    _highlightWin(row, col) {
        const player = this.board[row][col];
        const dirs = [[0,1],[1,0],[1,1],[1,-1]];
        for (const [dr, dc] of dirs) {
            const cells = [[row, col]];
            for (let i = 1; i < 4; i++) {
                const r = row + i*dr, c = col + i*dc;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) cells.push([r, c]);
            }
            for (let i = 1; i < 4; i++) {
                const r = row - i*dr, c = col - i*dc;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) cells.push([r, c]);
            }
            if (cells.length >= 4) {
                cells.forEach(([r, c]) => {
                    const el = this.boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    if (el) el.classList.add('winning');
                });
                break;
            }
        }
    }

    _checkDraw() {
        for (let col = 0; col < this.cols; col++) {
            if (this.board[this.rows - 1][col] === '') return false;
        }
        return true;
    }

    _endGame(result) {
        this.gameActive = false;
        const winner = result === 'win' ? (this.currentPlayer === 'red' ? 1 : 2) : 'draw';
        if (result === 'win') {
            this.scores[this.currentPlayer]++;
            const scoreEl = this.boardElement.querySelector(`#fiar-score-${this.currentPlayer}`);
            if (scoreEl) scoreEl.textContent = this.scores[this.currentPlayer];
        }

        const statusEl = this.boardElement.querySelector('#fiar-status');
        if (statusEl) {
            statusEl.textContent = result === 'win'
                ? `🎉 ${this.currentPlayer === 'red' ? 'Red' : 'Blue'} Wins!`
                : "🤝 It's a Draw!";
            statusEl.classList.remove('hidden');
        }

        const duration = Date.now() - (this.sessionStartTime || Date.now());
        this.eventBus?.emit('game:end', {
            gameId: 'fourinrow',
            winner,
            winReason: result === 'win' ? `${this.currentPlayer} connected four!` : "Board is full",
            moveCount: this.moveCount,
            sessionDuration: duration,
            scores: { 1: this.scores.red, 2: this.scores.blue }
        });
    }

    _resetGame() {
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(''));
        this.currentPlayer = 'red';
        this.gameActive = true;
        this.moveCount = 0;
        this.sessionStartTime = Date.now();
        this._buildBoard();
        this._updateTurn();
        const statusEl = this.boardElement.querySelector('#fiar-status');
        if (statusEl) statusEl.classList.add('hidden');
    }

    getState() {
        return { board: this.board, currentPlayer: this.currentPlayer === 'red' ? 1 : 2, gameActive: this.gameActive };
    }
    makeMove() { return { valid: false }; }
    cleanup() { if (this.boardElement) this.boardElement.innerHTML = ''; }
}
