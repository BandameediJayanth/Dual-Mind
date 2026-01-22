/*
  2-Player Ludo with classic photo-style board.
  - Logic rewritten to match the provided 15x15 board.jpg
  - Accurate track, base, and lane coordinates.
  - Mode 1: Blue vs Green
  - Mode 2: Red vs Yellow
*/

// DOM Elements
const boardEl = document.getElementById('board');
const rollBtn = document.getElementById('rollBtn');
const diceEl = document.getElementById('dice');
const turnText = document.getElementById('turnText');
const turnSw = document.getElementById('turnSwatch');
const popup = document.getElementById('popup');
const popupText = document.getElementById('popupText');
const resetBtn = document.getElementById('resetBtn');
const blueGreenBtn = document.getElementById('blueGreenBtn');
const redYellowBtn = document.getElementById('redYellowBtn');
const legend = document.getElementById('legend');

const N = 15;
let gameMode = 'blueGreen'; // 'blueGreen' or 'redYellow'

/* ---------- Grid & Board Building ---------- */
// Create the 15x15 grid cells
(function buildGrid() {
  boardEl.innerHTML = '';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `c-${r}-${c}`;
      boardEl.appendChild(cell);
    }
  }
})();

/* ---------- Board Path & Coordinates ---------- */
// A single, continuous, 52-step track, starting from Red's start and moving clockwise.
const BASE_TRACK = [
    // Red's path to corner
    { r: 1, c: 6 }, { r: 2, c: 6 }, { r: 3, c: 6 }, { r: 4, c: 6 }, { r: 5, c: 6 },
    // Top-right arm
    { r: 6, c: 5 }, { r: 6, c: 4 }, { r: 6, c: 3 }, { r: 6, c: 2 }, { r: 6, c: 1 }, { r: 6, c: 0 },
    { r: 7, c: 0 }, // Corner
    // Green's path to corner
    { r: 8, c: 1 }, { r: 8, c: 2 }, { r: 8, c: 3 }, { r: 8, c: 4 }, { r: 8, c: 5 },
    // Bottom-left arm
    { r: 9, c: 6 }, { r: 10, c: 6 }, { r: 11, c: 6 }, { r: 12, c: 6 }, { r: 13, c: 6 }, { r: 14, c: 6 },
    { r: 14, c: 7 }, // Corner
    // Yellow's path to corner
    { r: 13, c: 8 }, { r: 12, c: 8 }, { r: 11, c: 8 }, { r: 10, c: 8 }, { r: 9, c: 8 },
    // Bottom-right arm
    { r: 8, c: 9 }, { r: 8, c: 10 }, { r: 8, c: 11 }, { r: 8, c: 12 }, { r: 8, c: 13 }, { r: 8, c: 14 },
    { r: 7, c: 14 }, // Corner
    // Blue's path to corner
    { r: 6, c: 13 }, { r: 6, c: 12 }, { r: 6, c: 11 }, { r: 6, c: 10 }, { r: 6, c: 9 },
    // Top-left arm
    { r: 5, c: 8 }, { r: 4, c: 8 }, { r: 3, c: 8 }, { r: 2, c: 8 }, { r: 1, c: 8 }, { r: 0, c: 8 },
    { r: 0, c: 7 }, // Corner
];

// Function to generate a rotated path for each player
function generatePlayerPath(startIdx, lane) {
    const rotatedTrack = [...BASE_TRACK.slice(startIdx), ...BASE_TRACK.slice(0, startIdx)];
    // The path is 51 steps to get back to the start of the home lane.
    return [...rotatedTrack.slice(0, 51), ...lane];
}

// Player definitions with corrected coordinates and individual paths
const RED = {
  name: 'Red', color: 'red',
  base: [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }],
  startTrackIdx: 0,
  lane: [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 }],
};
RED.path = generatePlayerPath(RED.startTrackIdx, RED.lane);

const GREEN = {
  name: 'Green', color: 'green',
  base: [{ r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 }],
  startTrackIdx: 39,
  lane: [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 }],
};
GREEN.path = generatePlayerPath(GREEN.startTrackIdx, GREEN.lane);

const YELLOW = {
  name: 'Yellow', color: 'yellow',
  base: [{ r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 }],
  startTrackIdx: 26,
  lane: [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 }],
};
YELLOW.path = generatePlayerPath(YELLOW.startTrackIdx, YELLOW.lane);

const BLUE = {
  name: 'Blue', color: 'blue',
  base: [{ r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 }],
  startTrackIdx: 13,
  lane: [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }],
};
BLUE.path = generatePlayerPath(BLUE.startTrackIdx, BLUE.lane);


// Safe squares based on star positions on the board image
const SAFE_POSITIONS = [
    BASE_TRACK[8],  // Red safe
    BASE_TRACK[21], // Green safe
    BASE_TRACK[34], // Yellow safe
    BASE_TRACK[47], // Blue safe
    
    BASE_TRACK[0],  // Red start
    BASE_TRACK[13], // Blue start
    BASE_TRACK[26], // Yellow start
    BASE_TRACK[39], // Green start
];

function isSafePos(r, c) {
  return SAFE_POSITIONS.some(p => p.r === r && p.c === c);
}

function paintSafeSquares() {
  document.querySelectorAll('.safe').forEach(el => el.classList.remove('safe'));
  SAFE_POSITIONS.forEach(({ r, c }) => {
    const cell = document.getElementById(`c-${r}-${c}`);
    if (cell) cell.classList.add('safe');
  });
}

/* ---------- Piece Management ---------- */
function makePieceEl(color, i) {
  const d = document.createElement('div');
  d.className = `piece ${color}`;
  d.innerHTML = '♟';
  d.setAttribute('data-piece', i + 1);
  return d;
}

function makePieces(owner) {
  return [0, 1, 2, 3].map(i => ({
    owner,
    id: `${owner.name}-${i}`,
    state: 'base', // base | active | finished
    pathStep: -1, // -1 for base, 0-56 for path
    el: makePieceEl(owner.color, i),
  }));
}

function placeAt(r, c, el) {
  const cell = document.getElementById(`c-${r}-${c}`);
  if (cell) {
    // Handle stacking visually
    const existingPieces = cell.querySelectorAll('.piece').length;
    el.style.transform = `translate(${existingPieces * 4}px, ${existingPieces * 4}px)`;
    el.style.zIndex = 100 + existingPieces;
    cell.appendChild(el);
  }
}

function getPiecePos(p) {
  if (p.state === 'base') return null;
  if (p.state === 'active') return p.owner.path[p.pathStep];
  return { r: 7, c: 7 }; // Finished pieces go to the center
}

function drawPiece(p) {
  const pos = getPiecePos(p);
  if (pos) placeAt(pos.r, pos.c, p.el);
}

/* ---------- Game State & Mode ---------- */
let currentPlayers = [BLUE, GREEN];
let pieces = {};
let current = BLUE;
let lastRoll = null;
let selecting = false;

function updateGameMode(mode) {
  gameMode = mode;
  if (mode === 'blueGreen') {
    currentPlayers = [BLUE, GREEN];
    current = BLUE;
    blueGreenBtn.classList.add('active');
    redYellowBtn.classList.remove('active');
    legend.innerHTML = `
      <div><span class="chip blue"></span> Blue Player</div>
      <div><span class="chip green"></span> Green Player</div>
      <div><span class="safeBox"></span> Safe square</div>
    `;
  } else {
    currentPlayers = [RED, YELLOW];
    current = RED;
    redYellowBtn.classList.add('active');
    blueGreenBtn.classList.remove('active');
    legend.innerHTML = `
      <div><span class="chip red"></span> Red Player</div>
      <div><span class="chip yellow"></span> Yellow Player</div>
      <div><span class="safeBox"></span> Safe square</div>
    `;
  }
  resetGame();
}

function resetGame() {
  pieces = {};
  currentPlayers.forEach(player => {
    pieces[player.name] = makePieces(player);
  });
  resetPositions();
  lastRoll = null;
  selecting = false;
  updateUI();
}

function resetPositions() {
  document.querySelectorAll('.piece').forEach(p => p.remove());
  currentPlayers.forEach(player => {
    const playerPieces = pieces[player.name];
    playerPieces.forEach((p, i) => {
      p.state = 'base';
      p.pathStep = -1;
      p.el.classList.remove('finished');
      placeAt(player.base[i].r, player.base[i].c, p.el);
    });
  });
}

blueGreenBtn?.addEventListener('click', () => updateGameMode('blueGreen'));
redYellowBtn?.addEventListener('click', () => updateGameMode('redYellow'));

/* ---------- UI Updates ---------- */
function updateUI() {
  diceEl.textContent = lastRoll ?? '–';
  turnText.textContent = `${current.name}’s turn`;
  turnSw.className = `swatch ${current.color}`;
  rollBtn.disabled = selecting;
  paintSafeSquares();
}

function animateDice(final, cb) {
  diceEl.classList.add('rolling');
  let t = 0, iv = setInterval(() => {
    diceEl.textContent = (1 + Math.floor(Math.random() * 6));
    if (++t > 8) { clearInterval(iv); diceEl.classList.remove('rolling'); diceEl.textContent = final; cb && cb(); }
  }, 70);
}

/* ---------- Game Logic: Movement & Selection ---------- */
function getMovablePieces(player, n) {
  const arr = pieces[player.name];
  return arr.filter(p => {
    if (p.state === 'finished') return false;
    if (p.state === 'base') return n === 6;
    // Path length is 57 (0-56). 50 is last track square, 56 is last lane square.
    if (p.state === 'active') return p.pathStep + n <= 56; 
    return false;
  });
}

function movePiece(p, n) {
  // --- Move out of base ---
  if (p.state === 'base') {
    p.state = 'active';
    p.pathStep = 0; // Start at the beginning of their path
    drawPiece(p);
    captureIfAny(p);
    return;
  }

  // --- Move on path ---
  if (p.state === 'active') {
    p.pathStep += n;
    if (p.pathStep >= 56) { // Reaches or overshoots the end
      p.state = 'finished';
      p.el.classList.add('finished');
    }
    drawPiece(p);
    captureIfAny(p);
  }
}

function captureIfAny(mover) {
  const pos = getPiecePos(mover);
  // No capture on safe squares or if the piece has finished
  if (!pos || mover.state === 'finished' || isSafePos(pos.r, pos.c)) return;

  const allPieces = [...pieces[currentPlayers[0].name], ...pieces[currentPlayers[1].name]];
  allPieces.forEach(p => {
    // Cannot capture self, own pieces, or finished pieces
    if (p.id === mover.id || p.owner.name === mover.owner.name || p.state !== 'active') return;
    
    const pPos = getPiecePos(p);
    if (pPos && pPos.r === pos.r && pPos.c === pos.c) {
      // Send p back to base
      p.state = 'base';
      p.pathStep = -1;
      const basePos = p.owner.base[pieces[p.owner.name].indexOf(p)];
      placeAt(basePos.r, basePos.c, p.el);
    }
  });
}

function hasWon(player) {
  return pieces[player.name].every(p => p.state === 'finished');
}

let clickHandler = null;
function enableSelection(movable, n) {
  selecting = true;
  rollBtn.disabled = true;
  movable.forEach(p => p.el.classList.add('selectable'));

  clickHandler = (ev) => {
    const targetEl = ev.target.closest('.piece');
    if (!targetEl) return;

    const picked = movable.find(p => p.el === targetEl);
    if (!picked) return;

    // Cleanup
    movable.forEach(p => p.el.classList.remove('selectable'));
    boardEl.removeEventListener('click', clickHandler);
    selecting = false;

    // Move piece
    movePiece(picked, n);

    // Check for win
    if (hasWon(picked.owner)) {
      popup.style.display = 'flex';
      popupText.textContent = `🏆 ${picked.owner.name} wins!`;
      rollBtn.disabled = true;
      return;
    }

    // Next turn
    if (n !== 6) {
      current = currentPlayers.find(p => p !== current);
    }
    rollBtn.disabled = false;
    updateUI();
  };
  boardEl.addEventListener('click', clickHandler);
}

/* ---------- Turn / Roll ---------- */
function roll() {
  if (selecting) return;
  rollBtn.disabled = true;
  const n = 1 + Math.floor(Math.random() * 6);
  animateDice(n, () => {
    lastRoll = n;
    const movable = getMovablePieces(current, n);

    if (movable.length === 0) {
      if (n !== 6) current = currentPlayers.find(p => p !== current);
      rollBtn.disabled = false;
      updateUI();
      return;
    }
    
    if (movable.length === 1) {
        // Auto-move if only one option
        setTimeout(() => {
            movePiece(movable[0], n);
            if (hasWon(current)) {
                popup.style.display = 'flex';
                popupText.textContent = `🏆 ${current.name} wins!`;
                return;
            }
            if (n !== 6) current = currentPlayers.find(p => p !== current);
            rollBtn.disabled = false;
            updateUI();
        }, 300);
    } else {
        enableSelection(movable, n);
    }
  });
}
rollBtn.addEventListener('click', roll);

/* ---------- Reset ---------- */
resetBtn.addEventListener('click', () => {
  popup.style.display = 'none';
  updateGameMode(gameMode); // Reset based on current mode
});

/* ---------- Init ---------- */
updateGameMode('blueGreen');
console.log("Ludo game logic rewritten with dedicated player paths.");
