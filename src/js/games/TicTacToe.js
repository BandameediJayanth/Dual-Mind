export class TicTacToe {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.scores = { X: 0, O: 0 };
    }

    async init() {
        this.initializeGame();
    }

    initializeGame() {
        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        // Game board clicks
        document.getElementById('game-board').addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            }
        });

        // Reset game button
        document.getElementById('reset-game').addEventListener('click', () => {
            this.resetGame();
        });

        // Reset scores button
        document.getElementById('reset-scores').addEventListener('click', () => {
            this.resetScores();
        });
    }

    handleCellClick(cell) {
        const cellIndex = parseInt(cell.dataset.cellIndex);
        
        if (this.board[cellIndex] !== '' || !this.gameActive) {
            return;
        }

        this.makeMove(cellIndex);
    }

    makeMove(index) {
        this.board[index] = this.currentPlayer;
        this.updateCell(index);
        
        if (this.checkWin()) {
            this.handleWin();
        } else if (this.checkDraw()) {
            this.handleDraw();
        } else {
            this.switchPlayer();
        }
    }

    updateCell(index) {
        const cell = document.querySelector(`[data-cell-index="${index}"]`);
        cell.classList.add(this.board[index].toLowerCase());
    }

    checkWin() {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        for (let condition of winConditions) {
            const [a, b, c] = condition;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                
                // Highlight winning cells
                condition.forEach(index => {
                    const cell = document.querySelector(`[data-cell-index="${index}"]`);
                    cell.classList.add('winning');
                });
                
                return true;
            }
        }
        return false;
    }

    checkDraw() {
        return this.board.every(cell => cell !== '');
    }

    handleWin() {
        this.gameActive = false;
        this.scores[this.currentPlayer]++;
        this.updateScores();
        this.showGameStatus(`${this.currentPlayer} Wins! 🎉`);
        this.updateTurnIndicator();
    }

    handleDraw() {
        this.gameActive = false;
        this.showGameStatus("It's a Draw! 🤝");
        this.updateTurnIndicator();
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateDisplay();
    }

    updateDisplay() {
        this.updateTurnIndicator();
        this.updatePlayerActive();
    }

    updateTurnIndicator() {
        const turnIndicator = document.getElementById('turn-indicator');
        if (this.gameActive) {
            turnIndicator.textContent = `${this.currentPlayer}'s Turn`;
        } else {
            turnIndicator.textContent = 'Game Over';
        }
    }

    updatePlayerActive() {
        document.querySelectorAll('.player').forEach(player => {
            player.classList.remove('active');
        });
        
        if (this.gameActive) {
            const activePlayer = document.querySelector(`.player-${this.currentPlayer.toLowerCase()}`);
            activePlayer.classList.add('active');
        }
    }

    updateScores() {
        document.getElementById('score-x').textContent = this.scores.X;
        document.getElementById('score-o').textContent = this.scores.O;
    }

    showGameStatus(message) {
        const gameStatus = document.getElementById('game-status');
        gameStatus.textContent = message;
        gameStatus.className = 'game-status';
        
        if (message.includes('Wins')) {
            gameStatus.classList.add('win');
        } else if (message.includes('Draw')) {
            gameStatus.classList.add('draw');
        }
    }

    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        // Clear board display
        document.querySelectorAll('.cell').forEach(cell => {
            cell.className = 'cell';
        });
        
        // Clear game status
        document.getElementById('game-status').textContent = '';
        document.getElementById('game-status').className = 'game-status';
        
        this.updateDisplay();
    }

    resetScores() {
        this.scores = { X: 0, O: 0 };
        this.updateScores();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
}); 