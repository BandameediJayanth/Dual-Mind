/**
 * TicTacToe - Integrated from my_games/tic_tak_toe
 * Classic 3x3 grid game with modern UI design
 * Fixed: game:end payload includes moveCount + sessionDuration
 *        scores persist across rematch, proper reset on new game
 */
export class TicTacToe {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.board = Array(9).fill("");
    this.currentPlayer = "X";
    this.gameActive = true;
    this.scores = { X: 0, O: 0 };
    this.winningCells = null;
    this.boundClickHandler = null;
    this.moveStartTime = null;
    this.sessionStartTime = null;
    this.moveCount = 0;
    this.boardElement = null;
  }

  async init() {
    this.board = Array(9).fill("");
    this.currentPlayer = "X";
    this.gameActive = true;
    this.winningCells = null;
    this.moveStartTime = Date.now();
    this.sessionStartTime = Date.now();
    this.moveCount = 0;
    // NOTE: scores are NOT reset here — they persist across rematches
    // Call resetScores() explicitly to clear them
    console.log("TicTacToe initialized");
  }

  render(ctx, boardElement) {
    if (boardElement) {
      this.boardElement = boardElement;
    }
    if (!this.boardElement) return;

    const targetElement = this.boardElement;

    // Clear existing content
    targetElement.innerHTML = "";

    // Create game container with your custom styling
    const container = document.createElement("div");
    container.className = "ttt-container";
    container.innerHTML = `
      <div class="ttt-game-board" id="ttt-game-board">
        ${this.board
          .map(
            (cell, index) => `
          <div class="ttt-cell ${cell.toLowerCase()} ${this.winningCells?.includes(index) ? "winning" : ""}" 
               data-cell-index="${index}"></div>
        `,
          )
          .join("")}
      </div>
      <div class="ttt-game-controls">
        <button id="ttt-reset-game" class="ttt-btn ttt-btn-secondary">New Game</button>
      </div>
    `;

    targetElement.appendChild(container);

    // Add styles
    this.addStyles();

    // Bind events
    this.bindEvents(targetElement);
  }

  addStyles() {
    if (document.getElementById("ttt-styles")) return;

    const style = document.createElement("style");
    style.id = "ttt-styles";
    style.textContent = `
      .ttt-container {
        background: transparent;
        backdrop-filter: none;
        box-shadow: none;
        text-align: center;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      /* Removed redundant UI styles */


      .ttt-game-board {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin: 0 auto;
        width: min(400px, 90vw);
        aspect-ratio: 1;
        background: white;
        border: 4px solid #000;
        border-radius: 15px;
        padding: 8px;
        position: relative;
      }

      .ttt-game-board::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, #8b5cf6, #a855f7);
        border-radius: 17px;
        z-index: -1;
      }

      .ttt-cell {
        aspect-ratio: 1;
        background: white;
        border: 2px solid #000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .ttt-cell:nth-child(1) { border-top: none; border-left: none; }
      .ttt-cell:nth-child(2) { border-top: none; }
      .ttt-cell:nth-child(3) { border-top: none; border-right: none; }
      .ttt-cell:nth-child(4) { border-left: none; }
      .ttt-cell:nth-child(6) { border-right: none; }
      .ttt-cell:nth-child(7) { border-bottom: none; border-left: none; }
      .ttt-cell:nth-child(8) { border-bottom: none; }
      .ttt-cell:nth-child(9) { border-bottom: none; border-right: none; }

      .ttt-cell:hover:not(.x):not(.o) {
        background: #f8fafc;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }

      .ttt-cell.x::before {
        content: '';
        width: 60%;
        height: 60%;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20 20 L80 80 M80 20 L20 80" stroke="black" stroke-width="8" stroke-linecap="round"/></svg>') no-repeat center;
        background-size: contain;
      }

      .ttt-cell.o::before {
        content: '';
        width: 60%;
        height: 60%;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="none" stroke="black" stroke-width="8"/></svg>') no-repeat center;
        background-size: contain;
      }

      .ttt-cell.winning {
        background: linear-gradient(135deg, #fbbf24, #f59e0b) !important;
        animation: ttt-pulse 1s infinite;
      }

      @keyframes ttt-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      .ttt-game-controls {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin: 2rem 0;
      }

      .ttt-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
      }

      .ttt-btn-primary {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
      }

      .ttt-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      }

      .ttt-btn-secondary {
        background: #e2e8f0;
        color: #4a5568;
      }

      .ttt-btn-secondary:hover {
        background: #cbd5e0;
        transform: translateY(-2px);
      }



      @media (max-width: 600px) {
        .ttt-container {
          padding: 1.5rem;
        }
        
        .ttt-game-board {
          max-width: 250px;
        }
        
        .ttt-game-controls {
          flex-direction: column;
          align-items: center;
        }
        
        .ttt-btn {
          width: 100%;
          max-width: 200px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  bindEvents(boardElement) {
    // Remove old event listener if exists
    if (this.boundClickHandler) {
      boardElement.removeEventListener("click", this.boundClickHandler);
    }

    // Create new bound handler
    this.boundClickHandler = (e) => {
      const cell = e.target.closest(".ttt-cell");
      if (cell) {
        this.handleCellClick(cell);
      }
      if (e.target.id === "ttt-reset-game") {
        this.resetGame();
      }
    };

    boardElement.addEventListener("click", this.boundClickHandler);
  }

  handleCellClick(cell) {
    const cellIndex = parseInt(cell.dataset.cellIndex);

    if (this.board[cellIndex] !== "" || !this.gameActive) {
      return;
    }

    this.applyMove(cellIndex);
  }

  applyMove(index) {
    // Calculate decision time for analytics
    const decisionTime = Date.now() - (this.moveStartTime || Date.now());

    this.board[index] = this.currentPlayer;
    this.moveCount++;

    // Emit move event for analytics (feature extraction only — does NOT trigger GameController)
    this.eventBus?.emit("game:move", {
      gameId: "tictactoe",
      player: this.currentPlayer === "X" ? 1 : 2,
      position: index,
      timestamp: Date.now(),
      decisionTime: decisionTime,
    });

    if (this.checkWin()) {
      this.handleWin();
    } else if (this.checkDraw()) {
      this.handleDraw();
    } else {
      this.switchPlayer();
      this.render(null, this.boardElement);
      // Update global UI
      this.eventBus?.emit("game:turn", { player: this.currentPlayer === "X" ? 1 : 2 });
    }
  }

  checkWin() {
    const winConditions = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    for (let condition of winConditions) {
      const [a, b, c] = condition;
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        this.winningCells = condition;
        return true;
      }
    }
    this.winningCells = null;
    return false;
  }

  checkDraw() {
    return this.board.every((cell) => cell !== "");
  }

  handleWin() {
    this.gameActive = false;
    this.scores[this.currentPlayer]++;

    const sessionDuration = Date.now() - (this.sessionStartTime || Date.now());

    // Emit game end event with full payload for main.js to handle
    this.eventBus?.emit("game:end", {
      gameId: "tictactoe",
      winner: this.currentPlayer === "X" ? 1 : 2,
      winReason: `${this.currentPlayer} got three in a row!`,
      result: "win",
      moveCount: this.moveCount,
      sessionDuration: sessionDuration,
      scores: { ...this.scores },
    });

    this.render(null, this.boardElement);
  }

  handleDraw() {
    this.gameActive = false;

    const sessionDuration = Date.now() - (this.sessionStartTime || Date.now());

    // Emit game end event with full payload
    this.eventBus?.emit("game:end", {
      gameId: "tictactoe",
      winner: "draw",
      winReason: "Board is full — it's a draw!",
      result: "draw",
      moveCount: this.moveCount,
      sessionDuration: sessionDuration,
      scores: { ...this.scores },
    });

    this.render(null, this.boardElement);
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    this.moveStartTime = Date.now(); // Reset timer for next move
  }

  resetGame() {
    // Reset board state but keep scores
    this.board = Array(9).fill("");
    this.currentPlayer = "X";
    this.gameActive = true;
    this.winningCells = null;
    this.moveStartTime = Date.now();
    this.sessionStartTime = Date.now();
    this.moveCount = 0;
    this.render(null, this.boardElement);
  }

  resetScores() {
    this.scores = { X: 0, O: 0 };
    this.render(null, this.boardElement);
  }

  getState() {
    return {
      board: [...this.board],
      currentPlayer: this.currentPlayer === "X" ? 1 : 2,
      gameActive: this.gameActive,
      scores: { ...this.scores },
    };
  }

  cleanup() {
    if (this.boardElement && this.boundClickHandler) {
      this.boardElement.removeEventListener("click", this.boundClickHandler);
    }
    this.boundClickHandler = null;
  }

  // External interface for GameController (not used in self-contained mode)
  makeMove(data) {
    if (typeof data === "object" && data.position !== undefined) {
      const index = data.position;
      if (this.board[index] === "" && this.gameActive) {
        this.board[index] = this.currentPlayer;
        const won = this.checkWin();
        const draw = !won && this.checkDraw();

        if (!won && !draw) {
          this.switchPlayer();
        } else {
          this.gameActive = false;
          if (won) {
            this.scores[this.currentPlayer]++;
          }
        }

        return {
          valid: true,
          gameOver: won || draw,
          winner: won ? (this.currentPlayer === "X" ? 1 : 2) : null,
        };
      }
      return { valid: false, reason: "Invalid move" };
    }
    return { valid: false, reason: "Invalid move data" };
  }
}
