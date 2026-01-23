export class FourInARow {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.rows = 6;
        this.cols = 7;
        this.board = [];
        this.currentPlayer = 'red';
        this.gameActive = true;
        this.player1Name = 'Player 1';
        this.player2Name = 'Player 2';
        this.gameStats = { gamesPlayed: 0, player1Wins: 0, player2Wins: 0, draws: 0 };
    }

    async init() {
        this.initializeGame();
        this.loadStats();
    }

    initializeGame() {
        this.setupEventListeners();
        this.createBoard();
        this.updateCurrentPlayerDisplay();
        this.addEntranceAnimation();
    }

    setupEventListeners() {
        document.getElementById('resetButton').addEventListener('click', () => this.resetGame());
    }

    createBoard() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(''));

        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';

        // DOM shows top row first but board indexing still starts at row 0 (bottom)
        for (let row = this.rows - 1; row >= 0; row--) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'game-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(col));
                gameBoard.appendChild(cell);
            }
        }
    }

    handleCellClick(col) {
        if (!this.gameActive) return;

        const row = this.getLowestEmptyRow(col);
        if (row === -1) return;

        this.makeMove(row, col);
        this.updateBoard();

        if (this.checkWin(row, col)) {
            this.endGame('win');
        } else if (this.checkDraw()) {
            this.endGame('draw');
        } else {
            this.switchPlayer();
            this.updateCurrentPlayerDisplay();
        }
    }

    getLowestEmptyRow(col) {
        for (let row = 0; row < this.rows; row++) {
            if (this.board[row][col] === '') return row;
        }
        return -1;
    }

    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
    }

    updateBoard() {
        const cells = document.querySelectorAll('.game-cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.board[row][col];

            cell.classList.remove('red', 'blue', 'winning');
            if (value === 'red') cell.classList.add('red');
            if (value === 'blue') cell.classList.add('blue');
        });
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        if (!player) return false;
        return (
            this.checkDirection(row, col, 0, 1, player) ||
            this.checkDirection(row, col, 1, 0, player) ||
            this.checkDirection(row, col, 1, 1, player) ||
            this.checkDirection(row, col, 1, -1, player)
        );
    }

    checkDirection(row, col, rowDir, colDir, player) {
        let count = 1;

        for (let i = 1; i < 4; i++) {
            const newRow = row + i * rowDir;
            const newCol = col + i * colDir;
            if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) break;
            if (this.board[newRow][newCol] !== player) break;
            count++;
        }

        for (let i = 1; i < 4; i++) {
            const newRow = row - i * rowDir;
            const newCol = col - i * colDir;
            if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) break;
            if (this.board[newRow][newCol] !== player) break;
            count++;
        }

        if (count >= 4) {
            this.highlightWinningCells(row, col, rowDir, colDir, player);
            return true;
        }
        return false;
    }

    highlightWinningCells(row, col, rowDir, colDir, player) {
        for (let i = -3; i <= 3; i++) {
            const newRow = row + i * rowDir;
            const newCol = col + i * colDir;
            if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                if (this.board[newRow][newCol] === player) {
                    const cell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
                    if (cell) cell.classList.add('winning');
                }
            }
        }
    }

    checkDraw() {
        for (let col = 0; col < this.cols; col++) {
            if (this.board[this.rows - 1][col] === '') return false;
        }
        return true;
    }

    endGame(result) {
        this.gameActive = false;
        this.updateStats(result);
        this.showGameStatus(result);
    }

    showGameStatus(result) {
        const gameStatus = document.getElementById('gameStatus');
        const statusMessage = document.getElementById('statusMessage');
        if (result === 'win') {
            const winnerName = this.currentPlayer === 'red' ? this.player1Name : this.player2Name;
            statusMessage.textContent = `🎉 ${winnerName} Wins! 🎉`;
            statusMessage.style.color = '#e74c3c';
        } else {
            statusMessage.textContent = "🤝 It's a Draw! 🤝";
            statusMessage.style.color = '#7f8c8d';
        }
        gameStatus.classList.remove('hidden');
    }

    hideGameStatus() {
        document.getElementById('gameStatus').classList.add('hidden');
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
    }

    updateCurrentPlayerDisplay() {
        const currentPlayerName = document.getElementById('currentPlayerName');
        const currentPlayerToken = document.getElementById('currentPlayerToken');
        if (this.currentPlayer === 'red') {
            currentPlayerName.textContent = this.player1Name;
            currentPlayerToken.className = 'player-token red';
        } else {
            currentPlayerName.textContent = this.player2Name;
            currentPlayerToken.className = 'player-token blue';
        }
    }

    resetGame() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(''));
        this.currentPlayer = 'red';
        this.gameActive = true;
        this.updateBoard();
        this.hideGameStatus();
        this.updateCurrentPlayerDisplay();
    }

    updateStats(result) {
        this.gameStats.gamesPlayed++;
        if (result === 'win') {
            if (this.currentPlayer === 'red') this.gameStats.player1Wins++;
            else this.gameStats.player2Wins++;
        } else {
            this.gameStats.draws++;
        }
        this.displayStats();
        this.saveStats();
    }

    displayStats() {
        document.getElementById('gamesPlayed').textContent = this.gameStats.gamesPlayed;
        document.getElementById('player1Wins').textContent = this.gameStats.player1Wins;
        document.getElementById('player2Wins').textContent = this.gameStats.player2Wins;
        document.getElementById('draws').textContent = this.gameStats.draws;
    }

    saveStats() {
        localStorage.setItem('fourInARowStats', JSON.stringify(this.gameStats));
    }

    loadStats() {
        const savedStats = localStorage.getItem('fourInARowStats');
        if (savedStats) {
            this.gameStats = JSON.parse(savedStats);
            this.displayStats();
        }
    }

    addEntranceAnimation() {
        const cells = document.querySelectorAll('.game-cell');
        cells.forEach((cell, index) => {
            cell.style.opacity = '0';
            cell.style.transform = 'scale(0.5)';
            cell.style.transition = 'all 0.5s ease';
            setTimeout(() => {
                cell.style.opacity = '1';
                cell.style.transform = 'scale(1)';
            }, index * 20);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new FourInARow());
