/**
 * Ludo - Full 2-player implementation
 * Adapted from https://github.com/sohail-js/ludo-js
 * Race your 4 pieces from base → around the board → home
 */
import ludoBoardImg from "../../assets/images/ludo_board.jpg";

// ── Constants ───────────────────────────────────────────────────────────────
const STEP_LENGTH = 6.66; // percentage per grid cell

const PLAYERS = ["P1", "P2"];

const COORDINATES_MAP = {
  // Main track (0-51)
  0: [6, 13],
  1: [6, 12],
  2: [6, 11],
  3: [6, 10],
  4: [6, 9],
  5: [5, 8],
  6: [4, 8],
  7: [3, 8],
  8: [2, 8],
  9: [1, 8],
  10: [0, 8],
  11: [0, 7],
  12: [0, 6],
  13: [1, 6],
  14: [2, 6],
  15: [3, 6],
  16: [4, 6],
  17: [5, 6],
  18: [6, 5],
  19: [6, 4],
  20: [6, 3],
  21: [6, 2],
  22: [6, 1],
  23: [6, 0],
  24: [7, 0],
  25: [8, 0],
  26: [8, 1],
  27: [8, 2],
  28: [8, 3],
  29: [8, 4],
  30: [8, 5],
  31: [9, 6],
  32: [10, 6],
  33: [11, 6],
  34: [12, 6],
  35: [13, 6],
  36: [14, 6],
  37: [14, 7],
  38: [14, 8],
  39: [13, 8],
  40: [12, 8],
  41: [11, 8],
  42: [10, 8],
  43: [9, 8],
  44: [8, 9],
  45: [8, 10],
  46: [8, 11],
  47: [8, 12],
  48: [8, 13],
  49: [8, 14],
  50: [7, 14],
  51: [6, 14],

  // P1 home entrance (bottom-left → center)
  100: [7, 13],
  101: [7, 12],
  102: [7, 11],
  103: [7, 10],
  104: [7, 9],
  105: [7, 8],
  // P2 home entrance (top-right → center)
  200: [7, 1],
  201: [7, 2],
  202: [7, 3],
  203: [7, 4],
  204: [7, 5],
  205: [7, 6],

  // P1 base positions (bottom-left quadrant)
  500: [1.5, 10.58],
  501: [3.57, 10.58],
  502: [1.5, 12.43],
  503: [3.57, 12.43],
  // P2 base positions (top-right quadrant)
  600: [10.5, 1.58],
  601: [12.54, 1.58],
  602: [10.5, 3.45],
  603: [12.54, 3.45],
};

const BASE_POSITIONS = {
  P1: [500, 501, 502, 503],
  P2: [600, 601, 602, 603],
};

const START_POSITIONS = { P1: 0, P2: 26 };

const HOME_ENTRANCE = {
  P1: [100, 101, 102, 103, 104],
  P2: [200, 201, 202, 203, 204],
};

const HOME_POSITIONS = { P1: 105, P2: 205 };

const TURNING_POINTS = { P1: 50, P2: 24 };

const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

const STATE = {
  DICE_NOT_ROLLED: "DICE_NOT_ROLLED",
  DICE_ROLLED: "DICE_ROLLED",
};

// ── Ludo Class ──────────────────────────────────────────────────────────────
export class Ludo {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.boardElement = null;
    this.sessionStartTime = null;
    this.moveCount = 0;
    this.lastMoveTime = null;

    // Game state
    this.currentPositions = { P1: [], P2: [] };
    this._diceValue = 1;
    this._turn = 0; // index into PLAYERS
    this._state = STATE.DICE_NOT_ROLLED;
    this._animating = false;

    // DOM references (set during render)
    this._els = {};
    this._pieceEls = { P1: [], P2: [] };
  }

  async init() {
    this.sessionStartTime = Date.now();
    this.moveCount = 0;
    this.lastMoveTime = null;
    this._animating = false;
    console.log("Ludo initialized");
  }

  render(ctx, boardElement) {
    if (boardElement) this.boardElement = boardElement;
    if (!this.boardElement) return;

    // Prevent double-render
    if (this.boardElement.querySelector(".ludo-wrapper")) return;

    this.boardElement.innerHTML = "";
    this._addStyles();

    this.boardElement.innerHTML = `
            <div class="ludo-wrapper">
                <div class="ludo-board-container">
                    <div class="ludo-board">
                        <div class="ludo-pieces">
                            ${[0, 1, 2, 3].map((i) => `<div class="ludo-piece" data-player="P1" data-piece="${i}"></div>`).join("")}
                            ${[0, 1, 2, 3].map((i) => `<div class="ludo-piece" data-player="P2" data-piece="${i}"></div>`).join("")}
                        </div>
                        <div class="ludo-bases">
                            <div class="ludo-base" data-player="P1"></div>
                            <div class="ludo-base" data-player="P2"></div>
                        </div>
                    </div>
                </div>
                <div class="ludo-footer">
                    <div class="ludo-controls-row">
                        <div class="ludo-player-indicator">
                            <div class="ludo-player-dot" id="ludo-player-dot"></div>
                            <span id="ludo-active-player">Player 1</span>
                        </div>
                        <div class="ludo-dice-area">
                            <button id="ludo-dice-btn" class="ludo-btn ludo-btn-dice">🎲 Roll</button>
                            <div class="ludo-dice-value" id="ludo-dice-value">-</div>
                        </div>
                        <button id="ludo-reset-btn" class="ludo-btn ludo-btn-reset">Reset</button>
                    </div>
                    <div class="ludo-status" id="ludo-status"></div>
                </div>
            </div>
        `;

    this._cacheElements();
    this._bindEvents();
    this._resetGame();
  }

  // ── DOM helpers ─────────────────────────────────────────────────────────
  _qs(sel) {
    return this.boardElement.querySelector(sel);
  }

  _cacheElements() {
    this._els = {
      diceBtn: this._qs("#ludo-dice-btn"),
      diceValue: this._qs("#ludo-dice-value"),
      resetBtn: this._qs("#ludo-reset-btn"),
      playerDot: this._qs("#ludo-player-dot"),
      activePlayer: this._qs("#ludo-active-player"),
      status: this._qs("#ludo-status"),
      piecesContainer: this._qs(".ludo-pieces"),
    };

    this._pieceEls = { P1: [], P2: [] };
    PLAYERS.forEach((p) => {
      for (let i = 0; i < 4; i++) {
        this._pieceEls[p][i] = this._qs(
          `.ludo-piece[data-player="${p}"][data-piece="${i}"]`,
        );
      }
    });
  }

  _bindEvents() {
    this._els.diceBtn.addEventListener("click", () => this._onDiceClick());
    this._els.resetBtn.addEventListener("click", () => this._resetGame());
    this._els.piecesContainer.addEventListener("click", (e) =>
      this._onPieceClick(e),
    );
  }

  // ── Styles ──────────────────────────────────────────────────────────────
  _addStyles() {
    if (document.getElementById("ludo-styles")) return;
    const style = document.createElement("style");
    style.id = "ludo-styles";
    style.textContent = `
            .ludo-wrapper {
                display: flex; flex-direction: column; align-items: center;
                gap: 1rem; padding: 1rem; font-family: inherit;
            }
            .ludo-board-container {
                width: min(450px, 90vw); aspect-ratio: 1;
            }
            .ludo-board {
                width: 100%; height: 100%;
                background-image: url('${ludoBoardImg}');
                background-size: contain; background-repeat: no-repeat;
                position: relative;
            }
            .ludo-pieces { width: 100%; height: 100%; position: absolute; inset: 0; }
            .ludo-piece {
                width: 3.5%; height: 3.5%;
                border-radius: 50%;
                position: absolute;
                transform: translate(50%, 50%);
                transition: top 0.2s ease, left 0.2s ease;
                z-index: 1;
                border: 2px solid rgba(0,0,0,0.4);
                cursor: default;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .ludo-piece[data-player="P1"] {
                background: radial-gradient(circle at 35% 35%, #74b9ff, #2980b9);
            }
            .ludo-piece[data-player="P2"] {
                background: radial-gradient(circle at 35% 35%, #55efc4, #00b894);
            }
            .ludo-piece.highlight {
                cursor: pointer;
                border: 2px dashed gold;
                animation: ludo-spin 1s infinite linear;
                z-index: 5;
                box-shadow: 0 0 8px 2px gold;
            }
            @keyframes ludo-spin {
                0%   { transform: translate(50%, 50%) rotate(0deg); }
                50%  { transform: translate(50%, 50%) rotate(180deg) scale(1.3); }
                100% { transform: translate(50%, 50%) rotate(360deg); }
            }
            .ludo-bases .ludo-base {
                width: 40%; height: 40%;
                position: absolute;
                border: 0px solid transparent;
                pointer-events: none;
            }
            .ludo-base[data-player="P1"] { bottom: 0; left: 0; }
            .ludo-base[data-player="P2"] { top: 0; right: 0; }
            .ludo-base.highlight {
                animation: ludo-base-blink 0.7s infinite ease-in-out;
            }
            @keyframes ludo-base-blink {
                50% { border-color: rgba(255,255,255,0.8); }
            }
            .ludo-footer {
                display: flex; flex-direction: column; align-items: center;
                gap: 0.75rem; width: min(450px, 90vw);
            }
            .ludo-controls-row {
                display: flex; align-items: center; justify-content: space-between;
                width: 100%; gap: 0.75rem;
            }
            .ludo-player-indicator {
                display: flex; align-items: center; gap: 0.5rem;
                font-weight: 600; font-size: 0.95rem;
            }
            .ludo-player-dot {
                width: 22px; height: 22px; border-radius: 50%;
                border: 2px solid rgba(0,0,0,0.3);
                transition: background 0.3s;
            }
            .ludo-player-dot.p1 { background: radial-gradient(circle at 35% 35%, #74b9ff, #2980b9); }
            .ludo-player-dot.p2 { background: radial-gradient(circle at 35% 35%, #55efc4, #00b894); }
            .ludo-dice-area {
                display: flex; align-items: center; gap: 0.75rem;
            }
            .ludo-dice-value {
                font-size: 1.5rem; font-weight: 700;
                min-width: 32px; text-align: center;
            }
            .ludo-btn {
                padding: 0.5rem 1.2rem; border: none; border-radius: 8px;
                color: white; font-weight: 600; cursor: pointer;
                font-family: inherit; transition: opacity 0.2s;
            }
            .ludo-btn:hover { opacity: 0.9; }
            .ludo-btn:disabled { opacity: 0.4; cursor: not-allowed; }
            .ludo-btn-dice {
                background: linear-gradient(135deg, #00b894, #009d60);
                font-size: 1rem;
            }
            .ludo-btn-reset {
                background: linear-gradient(135deg, #667eea, #764ba2);
            }
            .ludo-status {
                min-height: 1.5rem; font-weight: 600; font-size: 0.9rem;
                color: #e2e8f0; text-align: center;
            }
        `;
    document.head.appendChild(style);
  }

  // ── UI updates ──────────────────────────────────────────────────────────
  _setDiceValueUI(val) {
    this._els.diceValue.textContent = val;
  }

  _enableDice() {
    this._els.diceBtn.removeAttribute("disabled");
  }

  _disableDice() {
    this._els.diceBtn.setAttribute("disabled", "");
  }

  _setTurnUI() {
    const player = PLAYERS[this._turn];
    const label = player === "P1" ? "Player 1 (Blue)" : "Player 2 (Green)";
    this._els.activePlayer.textContent = label;
    this._els.playerDot.className =
      "ludo-player-dot " + (player === "P1" ? "p1" : "p2");

    // Highlight active base
    this.boardElement
      .querySelectorAll(".ludo-base")
      .forEach((b) => b.classList.remove("highlight"));
    const base = this.boardElement.querySelector(
      `.ludo-base[data-player="${player}"]`,
    );
    if (base) base.classList.add("highlight");
  }

  _setPiecePositionUI(player, piece, newPosition) {
    const el = this._pieceEls[player]?.[piece];
    if (!el) return;
    const coords = COORDINATES_MAP[newPosition];
    if (!coords) return;
    const [x, y] = coords;
    el.style.top = y * STEP_LENGTH + "%";
    el.style.left = x * STEP_LENGTH + "%";
  }

  _highlightPieces(player, pieces) {
    pieces.forEach((piece) => {
      const el = this._pieceEls[player]?.[piece];
      if (el) el.classList.add("highlight");
    });
  }

  _unhighlightPieces() {
    this.boardElement
      .querySelectorAll(".ludo-piece.highlight")
      .forEach((el) => {
        el.classList.remove("highlight");
      });
  }

  _setStatus(msg) {
    if (this._els.status) this._els.status.textContent = msg;
  }

  // ── State management ────────────────────────────────────────────────────
  set diceValue(val) {
    this._diceValue = val;
    this._setDiceValueUI(val);
  }
  get diceValue() {
    return this._diceValue;
  }

  set turn(val) {
    this._turn = val;
    this._setTurnUI();
  }
  get turn() {
    return this._turn;
  }

  set state(val) {
    this._state = val;
    if (val === STATE.DICE_NOT_ROLLED) {
      this._enableDice();
      this._unhighlightPieces();
    } else {
      this._disableDice();
    }
  }
  get state() {
    return this._state;
  }

  // ── Game logic ──────────────────────────────────────────────────────────
  _resetGame() {
    this.currentPositions = structuredClone(BASE_POSITIONS);
    this.moveCount = 0;
    this.sessionStartTime = Date.now();
    this.lastMoveTime = null;
    this._animating = false;

    PLAYERS.forEach((player) => {
      [0, 1, 2, 3].forEach((piece) => {
        this._setPiecePosition(
          player,
          piece,
          this.currentPositions[player][piece],
        );
      });
    });

    this.turn = 0;
    this.state = STATE.DICE_NOT_ROLLED;
    this._setStatus("Roll the dice to begin!");
  }

  _setPiecePosition(player, piece, newPosition) {
    this.currentPositions[player][piece] = newPosition;
    this._setPiecePositionUI(player, piece, newPosition);
  }

  _onDiceClick() {
    if (this._animating) return;
    this.diceValue = 1 + Math.floor(Math.random() * 6);
    this.state = STATE.DICE_ROLLED;
    this._checkForEligiblePieces();
  }

  _checkForEligiblePieces() {
    const player = PLAYERS[this.turn];
    const eligible = this._getEligiblePieces(player);

    if (eligible.length) {
      this._highlightPieces(player, eligible);
      this._setStatus(
        `${player === "P1" ? "Blue" : "Green"}: Pick a piece to move`,
      );
    } else {
      this._setStatus(`No valid moves. Turn passes.`);
      setTimeout(() => this._incrementTurn(), 800);
    }
  }

  _getEligiblePieces(player) {
    return [0, 1, 2, 3].filter((piece) => {
      const pos = this.currentPositions[player][piece];

      // Already home — can't move
      if (pos === HOME_POSITIONS[player]) return false;

      // In base — need a 6 to come out
      if (BASE_POSITIONS[player].includes(pos) && this.diceValue !== 6)
        return false;

      // On home entrance — can't overshoot
      if (
        HOME_ENTRANCE[player].includes(pos) &&
        this.diceValue > HOME_POSITIONS[player] - pos
      )
        return false;

      return true;
    });
  }

  _incrementTurn() {
    this.turn = this.turn === 0 ? 1 : 0;
    this.state = STATE.DICE_NOT_ROLLED;
  }

  _onPieceClick(e) {
    if (this._animating) return;
    const target = e.target;
    if (
      !target.classList.contains("ludo-piece") ||
      !target.classList.contains("highlight")
    )
      return;

    const player = target.dataset.player;
    const piece = parseInt(target.dataset.piece);
    this._handlePieceClick(player, piece);
  }

  _handlePieceClick(player, piece) {
    const currentPos = this.currentPositions[player][piece];

    // Decision time tracking
    const decisionTime = this.lastMoveTime
      ? Date.now() - this.lastMoveTime
      : Date.now() - (this.sessionStartTime || Date.now());
    this.lastMoveTime = Date.now();
    this.moveCount++;

    // Emit move event
    this.eventBus?.emit("game:move", {
      gameId: "ludo",
      player: player === "P1" ? 1 : 2,
      position: { piece, from: currentPos, diceValue: this.diceValue },
      timestamp: Date.now(),
      decisionTime,
    });

    // Piece is in base → move to start
    if (BASE_POSITIONS[player].includes(currentPos)) {
      this._setPiecePosition(player, piece, START_POSITIONS[player]);
      this._unhighlightPieces();

      // Check for kill at start position
      const isKill = this._checkForKill(player, piece);
      if (isKill) {
        this._setStatus(
          `💥 ${player === "P1" ? "Blue" : "Green"} captures! Roll again.`,
        );
      }

      this.state = STATE.DICE_NOT_ROLLED;
      return;
    }

    this._unhighlightPieces();
    this._movePiece(player, piece, this.diceValue);
  }

  _movePiece(player, piece, moveBy) {
    this._animating = true;
    const interval = setInterval(() => {
      this._incrementPiecePosition(player, piece);
      moveBy--;

      if (moveBy === 0) {
        clearInterval(interval);
        this._animating = false;

        // Check win
        if (this._hasPlayerWon(player)) {
          const winnerLabel =
            player === "P1" ? "Player 1 (Blue)" : "Player 2 (Green)";
          this._setStatus(`🎉 ${winnerLabel} wins!`);

          this.eventBus?.emit("game:end", {
            gameId: "ludo",
            winner: player === "P1" ? 1 : 2,
            winReason: `${winnerLabel} got all pieces home!`,
            moveCount: this.moveCount,
            sessionDuration: Date.now() - (this.sessionStartTime || Date.now()),
            scores: { 1: 0, 2: 0 },
          });
          return;
        }

        const isKill = this._checkForKill(player, piece);

        // Extra turn on kill or 6
        if (isKill || this.diceValue === 6) {
          if (isKill) {
            this._setStatus(
              `💥 ${player === "P1" ? "Blue" : "Green"} captures! Roll again.`,
            );
          } else {
            this._setStatus(`Rolled a 6! Roll again.`);
          }
          this.state = STATE.DICE_NOT_ROLLED;
          return;
        }

        this._incrementTurn();
      }
    }, 200);
  }

  _incrementPiecePosition(player, piece) {
    const newPos = this._getIncrementedPosition(player, piece);
    this._setPiecePosition(player, piece, newPos);
  }

  _getIncrementedPosition(player, piece) {
    const pos = this.currentPositions[player][piece];

    // Reached turning point → enter home entrance
    if (pos === TURNING_POINTS[player]) {
      return HOME_ENTRANCE[player][0];
    }
    // Wrap around main track
    if (pos === 51) {
      return 0;
    }
    return pos + 1;
  }

  _checkForKill(player, piece) {
    const currentPos = this.currentPositions[player][piece];
    const opponent = player === "P1" ? "P2" : "P1";
    let kill = false;

    [0, 1, 2, 3].forEach((oppPiece) => {
      const oppPos = this.currentPositions[opponent][oppPiece];
      if (currentPos === oppPos && !SAFE_POSITIONS.includes(currentPos)) {
        // Send opponent piece back to base
        this._setPiecePosition(
          opponent,
          oppPiece,
          BASE_POSITIONS[opponent][oppPiece],
        );
        kill = true;
      }
    });

    return kill;
  }

  _hasPlayerWon(player) {
    return [0, 1, 2, 3].every(
      (piece) =>
        this.currentPositions[player][piece] === HOME_POSITIONS[player],
    );
  }

  // ── Interface methods ───────────────────────────────────────────────────
  getState() {
    return {
      board: this.currentPositions,
      currentPlayer: this.turn === 0 ? 1 : 2,
      gameActive: true,
      diceValue: this.diceValue,
    };
  }

  makeMove() {
    return { valid: false };
  }

  cleanup() {
    if (this.boardElement) this.boardElement.innerHTML = "";
  }
}
