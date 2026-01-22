class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.currentPlayer = 1; // Player 1 starts
        this.playerScores = { 1: 0, 2: 0 };
        this.gameStarted = false;
        
        this.symbols = ['💎', '❤', '🍏', '🫑', '🪷', '🎄', '😀', '⏳', '🎮', '🎳', '🎯', '🎲'];
        this.initializeGame();
    }

    initializeGame() {
        this.createBoard();
        this.bindEvents();
        this.updateDisplay();
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        // Create pairs of cards
        const cardPairs = [...this.symbols, ...this.symbols];
        this.shuffleArray(cardPairs);
        
        cardPairs.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.index = index;
            card.dataset.symbol = symbol;
            
            card.innerHTML = `
                <div class="card-front">
                    <span class="card-symbol">${symbol}</span>
                </div>
                <div class="card-back"></div>
            `;
            
            gameBoard.appendChild(card);
            this.cards.push(card);
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    bindEvents() {
        document.getElementById('new-game').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('reset-stats').addEventListener('click', () => {
            this.resetStats();
        });

        // Card click events
        document.getElementById('game-board').addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card && !card.classList.contains('flipped') && !card.classList.contains('matched')) {
                this.flipCard(card);
            }
        });
    }

    flipCard(card) {
        if (!this.gameStarted) {
            this.startGame();
        }

        if (this.flippedCards.length >= 2) {
            return;
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.checkMatch();
        }

        this.updateDisplay();
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const symbol1 = card1.dataset.symbol;
        const symbol2 = card2.dataset.symbol;

        if (symbol1 === symbol2) {
            // Match found - current player gets points and another turn
            setTimeout(() => {
                // Keep both cards flipped AND mark them as matched
                card1.classList.add('matched');
                card2.classList.add('matched');
                // DO NOT remove the 'flipped' class - keep cards visible!
                this.flippedCards = [];
                this.matchedPairs++;
                this.playerScores[this.currentPlayer] += 100;
                
                if (this.matchedPairs === this.symbols.length) {
                    this.gameComplete();
                } else {
                    // Player gets another turn for finding a match
                    this.showGameStatus(`Player ${this.currentPlayer} found a match! Gets another turn! 🎉`, 'complete');
                }
            }, 500);
        } else {
            // No match - flip cards back to hidden state and switch players
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
                this.switchPlayer();
                this.showGameStatus(`No match! Player ${this.currentPlayer}'s turn`, '');
            }, 1000);
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateDisplay();
    }

    startGame() {
        this.gameStarted = true;
    }

    gameComplete() {
        this.gameStarted = false;
        
        // Determine winner
        let winner;
        if (this.playerScores[1] > this.playerScores[2]) {
            winner = 1;
        } else if (this.playerScores[2] > this.playerScores[1]) {
            winner = 2;
        } else {
            winner = 'tie';
        }
        
        let message;
        if (winner === 'tie') {
            message = `🤝 It's a tie! Both players scored ${this.playerScores[1]} points!`;
        } else {
            message = `🎉 Player ${winner} wins with ${this.playerScores[winner]} points!`;
        }
        
        this.showGameStatus(message, 'win');
        this.updateDisplay();
    }

    newGame() {
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.currentPlayer = 1;
        this.gameStarted = false;
        
        this.createBoard();
        this.clearGameStatus();
        this.updateDisplay();
    }

    resetStats() {
        this.playerScores = { 1: 0, 2: 0 };
        this.updateDisplay();
    }

    updateDisplay() {
        document.getElementById('score-1').textContent = this.playerScores[1];
        document.getElementById('score-2').textContent = this.playerScores[2];
        
        // Update turn indicator
        const turnIndicator = document.getElementById('turn-indicator');
        if (this.gameStarted && this.matchedPairs < this.symbols.length) {
            turnIndicator.textContent = `Player ${this.currentPlayer}'s Turn`;
        } else if (this.matchedPairs >= this.symbols.length) {
            turnIndicator.textContent = 'Game Over!';
        } else {
            turnIndicator.textContent = 'Click a card to start!';
        }
        
        // Update active player styling
        document.querySelectorAll('.player').forEach(player => {
            player.classList.remove('active');
        });
        
        if (this.gameStarted && this.matchedPairs < this.symbols.length) {
            const activePlayer = document.querySelector(`.player-${this.currentPlayer}`);
            if (activePlayer) {
                activePlayer.classList.add('active');
            }
        }
    }

    showGameStatus(message, type = '') {
        const gameStatus = document.getElementById('game-status');
        gameStatus.textContent = message;
        gameStatus.className = `game-status ${type}`;
    }

    clearGameStatus() {
        const gameStatus = document.getElementById('game-status');
        gameStatus.textContent = '';
        gameStatus.className = 'game-status';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
}); 