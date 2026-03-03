/**
 * SeaWars - Integrated from my_games/Seawars
 * Battleship-style naval combat game
 */
export class SeaWars {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.boardElement = null;
    this.sessionStartTime = null;
    this.moveCount = 0;
  }

  async init() {
    this.sessionStartTime = Date.now();
    this.moveCount = 0;
    console.log("SeaWars initialized");
  }

  render(ctx, boardElement) {
    if (boardElement) this.boardElement = boardElement;
    if (!this.boardElement) return;

    // If wrapper exists, the game is already running. Do not re-init.
    if (this.boardElement.querySelector(".sw-wrapper")) {
      return;
    }

    this.boardElement.innerHTML = "";
    this._addStyles();
    this._initEngine();
  }

  _addStyles() {
    if (document.getElementById("sw-styles")) return;
    const style = document.createElement("style");
    style.id = "sw-styles";
    style.textContent = `
            .sw-wrapper { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; font-family: inherit; }
            .sw-info { font-weight: 600; font-size: 1rem; padding: 0.5rem 1rem; background: #f0f0f0; border-radius: 8px; text-align: center; min-height: 2.5rem; display: flex; align-items: center; }
            .sw-boards { display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; }
            .sw-board-section { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
            .sw-board-title { font-weight: 700; font-size: 0.9rem; }
            .sw-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; width: min(300px, 45vw); }
            .sw-cell { aspect-ratio: 1; border-radius: 3px; background: #b8d4e8; cursor: pointer; transition: all 0.2s; border: 1px solid rgba(0,0,0,0.1); }
            .sw-cell:hover { background: #8ab8d4; }
            .sw-cell.ship { background: #4a5568; }
            .sw-cell.hit { background: #e53e3e; cursor: default; }
            .sw-cell.miss { background: #a0aec0; cursor: default; }
            .sw-controls { display: flex; gap: 1rem; }
            .sw-btn { padding: 0.5rem 1.5rem; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: 600; cursor: pointer; font-family: inherit; }
            .sw-btn:hover { opacity: 0.9; }
            .sw-phase-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: #667eea; color: white; }
        `;
    document.head.appendChild(style);
  }

  _initEngine() {
    const GRID_SIZE = 10;
    const SHIP_SIZES = [4, 3, 3, 2, 2, 1];
    const eventBus = this.eventBus;
    const self = this;

    const wrapper = document.createElement("div");
    wrapper.className = "sw-wrapper";
    wrapper.innerHTML = `
            <div class="sw-info" id="sw-info">Player 1: Place your ships!</div>
            <div class="sw-boards">
                <div class="sw-board-section">
                    <div class="sw-board-title">⚓ Player 1's Fleet</div>
                    <div class="sw-grid" id="sw-grid1"></div>
                </div>
                <div class="sw-board-section">
                    <div class="sw-board-title">⚓ Player 2's Fleet</div>
                    <div class="sw-grid" id="sw-grid2"></div>
                </div>
            </div>
            <div class="sw-controls">
                <button id="sw-restart" class="sw-btn">New Game</button>
            </div>
        `;
    this.boardElement.appendChild(wrapper);

    let player1Board = [],
      player2Board = [];
    let currentPlayer = 1,
      placingShips = true,
      currentShipIndex = 0,
      gameOver = false;

    const player1Grid = wrapper.querySelector("#sw-grid1");
    const player2Grid = wrapper.querySelector("#sw-grid2");
    const info = wrapper.querySelector("#sw-info");

    wrapper.querySelector("#sw-restart").addEventListener("click", startGame);

    startGame();

    function startGame() {
      player1Board = [];
      player2Board = [];
      gameOver = false;
      placingShips = true;
      currentShipIndex = 0;
      currentPlayer = 1;
      self.moveCount = 0;
      self.sessionStartTime = Date.now();
      createBoard(player1Grid, player1Board, 1);
      createBoard(player2Grid, player2Board, 2);
      info.textContent = "Player 1: Place your ships! (horizontal placement)";
    }

    function createBoard(grid, boardArray, playerNum) {
      grid.innerHTML = "";
      boardArray.length = 0;
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement("div");
        cell.classList.add("sw-cell");
        cell.dataset.index = i;
        cell.addEventListener("click", () => handleCellClick(playerNum, i));
        boardArray.push({ ship: false, hit: false });
        grid.appendChild(cell);
      }
    }

    function handleCellClick(playerNum, index) {
      if (gameOver) return;
      if (placingShips) {
        if (playerNum !== currentPlayer) return;
        placeShip(index);
      } else {
        if (playerNum === currentPlayer) return;
        attackCell(playerNum, index);
      }
    }

    function placeShip(index) {
      const board = currentPlayer === 1 ? player1Board : player2Board;
      const grid = currentPlayer === 1 ? player1Grid : player2Grid;
      const size = SHIP_SIZES[currentShipIndex];
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;

      if (col + size > GRID_SIZE) {
        info.textContent = "Not enough space! Try another position.";
        return;
      }
      for (let i = 0; i < size; i++) {
        if (board[row * GRID_SIZE + col + i].ship) {
          info.textContent = "Ships cannot overlap!";
          return;
        }
      }
      for (let i = 0; i < size; i++) {
        board[row * GRID_SIZE + col + i].ship = true;
        grid.children[row * GRID_SIZE + col + i].classList.add("ship");
      }

      currentShipIndex++;
      if (currentShipIndex >= SHIP_SIZES.length) {
        currentShipIndex = 0;
        if (currentPlayer === 1) {
          currentPlayer = 2;
          info.textContent = "Player 2: Place your ships!";
        } else {
          placingShips = false;
          currentPlayer = 1;
          // Hide ships from view (remove ship class from both grids)
          Array.from(player1Grid.children).forEach((c) =>
            c.classList.remove("ship"),
          );
          Array.from(player2Grid.children).forEach((c) =>
            c.classList.remove("ship"),
          );
          info.textContent =
            "All ships placed! Player 1: Attack Player 2's grid!";
        }
      } else {
        info.textContent = `Player ${currentPlayer}: Place ship of size ${SHIP_SIZES[currentShipIndex]}`;
      }
    }

    function attackCell(playerNum, index) {
      const board = playerNum === 1 ? player1Board : player2Board;
      const grid = playerNum === 1 ? player1Grid : player2Grid;
      if (board[index].hit) {
        info.textContent = "Already attacked here!";
        return;
      }
      board[index].hit = true;
      self.moveCount++;

      eventBus?.emit("game:move", {
        gameId: "seawars",
        player: currentPlayer,
        position: {
          index,
          row: Math.floor(index / GRID_SIZE),
          col: index % GRID_SIZE,
        },
        timestamp: Date.now(),
        decisionTime: 0,
        isHit: board[index].ship,
      });

      if (board[index].ship) {
        grid.children[index].classList.add("hit");
        info.textContent = `Hit! Player ${currentPlayer} goes again.`;
        if (checkWin(board)) {
          info.textContent = `🎉 Player ${currentPlayer} wins!`;
          gameOver = true;
          const duration = Date.now() - (self.sessionStartTime || Date.now());
          eventBus?.emit("game:end", {
            gameId: "seawars",
            winner: currentPlayer,
            winReason: `Player ${currentPlayer} sank all enemy ships!`,
            moveCount: self.moveCount,
            sessionDuration: duration,
            scores: {
              1: currentPlayer === 1 ? 1 : 0,
              2: currentPlayer === 2 ? 1 : 0,
            },
          });
        }
      } else {
        grid.children[index].classList.add("miss");
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        info.textContent = `Miss! Player ${currentPlayer}'s turn — attack the enemy grid!`;
      }
    }

    function checkWin(board) {
      return board.every((cell) => !cell.ship || cell.hit);
    }
  }

  getState() {
    return { currentPlayer: 1, gameActive: true };
  }
  makeMove() {
    return { valid: false };
  }
  cleanup() {
    if (this.boardElement) this.boardElement.innerHTML = "";
  }
}
