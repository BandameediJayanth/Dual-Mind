/**
 * MemoryMatch - Integrated from my_games/Memory_Game
 * Find matching pairs of cards — 2 player competitive version
 */
export class MemoryMatch {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.boardElement = null;
    this.sessionStartTime = null;
    this.moveCount = 0;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.currentPlayer = 1;
    this.playerScores = { 1: 0, 2: 0 };
    this.gameStarted = false;
    this.symbols = [
      "💎",
      "❤️",
      "🍏",
      "🫑",
      "🪷",
      "🎄",
      "😀",
      "⏳",
      "🎮",
      "🎳",
      "🎯",
      "🎲",
    ];
  }

  async init() {
    this.sessionStartTime = Date.now();
    this.moveCount = 0;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.currentPlayer = 1;
    this.playerScores = { 1: 0, 2: 0 };
    this.gameStarted = false;
    console.log("MemoryMatch initialized");
  }

  render(ctx, boardElement) {
    if (boardElement) this.boardElement = boardElement;
    if (!this.boardElement) return;

    // If wrapper exists, return
    if (this.boardElement.querySelector(".mm-wrapper")) return;

    this.boardElement.innerHTML = "";
    this._addStyles();

    this.boardElement.innerHTML = `
            <div class="mm-wrapper">
                <div class="mm-header">
                    <div class="mm-player mm-player-1 active" id="mm-p1">
                        <span>Player 1</span>
                        <span class="mm-score" id="mm-score-1">0</span>
                    </div>
                    <div class="mm-turn" id="mm-turn">Click a card to start!</div>
                    <div class="mm-player mm-player-2" id="mm-p2">
                        <span>Player 2</span>
                        <span class="mm-score" id="mm-score-2">0</span>
                    </div>
                </div>
                <div class="mm-board" id="mm-board"></div>
                <div class="mm-status" id="mm-status"></div>
                <div class="mm-controls">
                    <button id="mm-new-game" class="mm-btn">New Game</button>
                    <button id="mm-reset-stats" class="mm-btn mm-btn-secondary">Reset Scores</button>
                </div>
            </div>
        `;

    this._createBoard();
    this._bindEvents();
  }

  _addStyles() {
    if (document.getElementById("mm-styles")) return;
    const style = document.createElement("style");
    style.id = "mm-styles";
    style.textContent = `
            .mm-wrapper { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; font-family: inherit; }
            .mm-header { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 600px; }
            .mm-player { display: flex; flex-direction: column; align-items: center; padding: 0.75rem 1.25rem; border-radius: 12px; background: #f0f0f0; transition: all 0.3s; opacity: 0.6; }
            .mm-player.active { opacity: 1; background: linear-gradient(135deg, #667eea, #764ba2); color: white; transform: scale(1.05); }
            .mm-score { font-size: 1.5rem; font-weight: 700; }
            .mm-turn { font-weight: 600; font-size: 0.9rem; text-align: center; max-width: 140px; }
            .mm-board { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; width: min(600px, 95vw); }
            .mm-card { aspect-ratio: 1; border-radius: 10px; cursor: pointer; position: relative; transform-style: preserve-3d; transition: transform 0.4s; }
            .mm-card.flipped { transform: rotateY(180deg); }
            .mm-card.matched { transform: rotateY(180deg); opacity: 0.7; cursor: default; }
            .mm-card-front, .mm-card-back { position: absolute; inset: 0; border-radius: 10px; backface-visibility: hidden; display: flex; align-items: center; justify-content: center; }
            .mm-card-front { background: linear-gradient(135deg, #667eea, #764ba2); transform: rotateY(180deg); font-size: 1.8rem; }
            .mm-card-back { background: linear-gradient(135deg, #2c3e50, #34495e); }
            .mm-card-back::after { content: '?'; color: rgba(255,255,255,0.3); font-size: 1.5rem; font-weight: 700; }
            .mm-status { min-height: 2rem; font-weight: 600; color: #4a5568; text-align: center; }
            .mm-controls { display: flex; gap: 1rem; }
            .mm-btn { padding: 0.5rem 1.5rem; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: 600; cursor: pointer; font-family: inherit; }
            .mm-btn-secondary { background: #e2e8f0; color: #4a5568; }
        `;
    document.head.appendChild(style);
  }

  _createBoard() {
    const boardEl = this.boardElement.querySelector("#mm-board");
    boardEl.innerHTML = "";
    this.cards = [];

    const cardPairs = [...this.symbols, ...this.symbols];
    // Shuffle
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }

    cardPairs.forEach((symbol, index) => {
      const card = document.createElement("div");
      card.className = "mm-card";
      card.dataset.index = index;
      card.dataset.symbol = symbol;
      card.innerHTML = `
                <div class="mm-card-front"><span>${symbol}</span></div>
                <div class="mm-card-back"></div>
            `;
      boardEl.appendChild(card);
      this.cards.push(card);
    });
  }

  _bindEvents() {
    const boardEl = this.boardElement.querySelector("#mm-board");
    boardEl.addEventListener("click", (e) => {
      const card = e.target.closest(".mm-card");
      if (
        card &&
        !card.classList.contains("flipped") &&
        !card.classList.contains("matched")
      ) {
        this._flipCard(card);
      }
    });
    this.boardElement
      .querySelector("#mm-new-game")
      .addEventListener("click", () => this._newGame());
    this.boardElement
      .querySelector("#mm-reset-stats")
      .addEventListener("click", () => {
        this.playerScores = { 1: 0, 2: 0 };
        this._updateDisplay();
      });
  }

  _flipCard(card) {
    if (!this.gameStarted) this.gameStarted = true;
    if (this.flippedCards.length >= 2) return;

    card.classList.add("flipped");
    this.flippedCards.push(card);
    this.moveCount++;

    // If this is the 2nd flip, check if it matches the 1st (both already in array)
    const isMatch =
      this.flippedCards.length === 2 &&
      this.flippedCards[0].dataset.symbol === card.dataset.symbol;

    this.eventBus?.emit("game:move", {
      gameId: "memorymatch",
      player: this.currentPlayer,
      position: {
        index: parseInt(card.dataset.index),
        symbol: card.dataset.symbol,
      },
      timestamp: Date.now(),
      decisionTime: 0,
      isOptimal: isMatch,      // remembered the matching card's position
      isStrategic: isMatch,
    });

    if (this.flippedCards.length === 2) {
      this._checkMatch();
    }
    this._updateDisplay();
  }

  _checkMatch() {
    const [card1, card2] = this.flippedCards;
    if (card1.dataset.symbol === card2.dataset.symbol) {
      setTimeout(() => {
        card1.classList.add("matched");
        card2.classList.add("matched");
        this.flippedCards = [];
        this.matchedPairs++;
        this.playerScores[this.currentPlayer] += 100;
        if (this.matchedPairs === this.symbols.length) {
          this._gameComplete();
        } else {
          this._setStatus(
            `Player ${this.currentPlayer} found a match! Gets another turn! 🎉`,
          );
          this._updateDisplay();
        }
      }, 500);
    } else {
      setTimeout(() => {
        card1.classList.remove("flipped");
        card2.classList.remove("flipped");
        this.flippedCards = [];
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this._setStatus(`No match! Player ${this.currentPlayer}'s turn`);
        this._updateDisplay();
      }, 1000);
    }
  }

  _gameComplete() {
    this.gameStarted = false;
    const winner =
      this.playerScores[1] > this.playerScores[2]
        ? 1
        : this.playerScores[2] > this.playerScores[1]
          ? 2
          : "draw";
    const msg =
      winner === "draw"
        ? `🤝 It's a tie! Both scored ${this.playerScores[1]} pts!`
        : `🎉 Player ${winner} wins with ${this.playerScores[winner]} pts!`;
    this._setStatus(msg);
    this._updateDisplay();

    const duration = Date.now() - (this.sessionStartTime || Date.now());
    this.eventBus?.emit("game:end", {
      gameId: "memorymatch",
      winner,
      winReason: msg,
      moveCount: this.moveCount,
      sessionDuration: duration,
      scores: { ...this.playerScores },
    });
  }

  _newGame() {
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.currentPlayer = 1;
    this.gameStarted = false;
    this.moveCount = 0;
    this.sessionStartTime = Date.now();
    this._createBoard();
    this._setStatus("");
    this._updateDisplay();
  }

  _setStatus(msg) {
    const el = this.boardElement.querySelector("#mm-status");
    if (el) el.textContent = msg;
  }

  _updateDisplay() {
    const s1 = this.boardElement.querySelector("#mm-score-1");
    const s2 = this.boardElement.querySelector("#mm-score-2");
    const turn = this.boardElement.querySelector("#mm-turn");
    const p1 = this.boardElement.querySelector("#mm-p1");
    const p2 = this.boardElement.querySelector("#mm-p2");

    if (s1) s1.textContent = this.playerScores[1];
    if (s2) s2.textContent = this.playerScores[2];
    if (turn) {
      turn.textContent =
        this.gameStarted && this.matchedPairs < this.symbols.length
          ? `Player ${this.currentPlayer}'s Turn`
          : this.matchedPairs >= this.symbols.length
            ? "Game Over!"
            : "Click a card to start!";
    }
    if (p1)
      p1.classList.toggle(
        "active",
        this.currentPlayer === 1 && this.gameStarted,
      );
    if (p2)
      p2.classList.toggle(
        "active",
        this.currentPlayer === 2 && this.gameStarted,
      );
  }

  getState() {
    return { currentPlayer: this.currentPlayer, gameActive: this.gameStarted };
  }
  makeMove() {
    return { valid: false };
  }
  cleanup() {
    if (this.boardElement) this.boardElement.innerHTML = "";
  }
}
