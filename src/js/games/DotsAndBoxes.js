// ----- Config -----
const GRID_DOTS = 7;            // 7x7 dots => 6x6 boxes
const SPACING   = 60;           // px between dot centers
const DOT       = 14;           // dot diameter
const LINE_THK  = 10;           // visible line thickness

// ----- State -----
let currentPlayer = 1;          // 1 or 2
let scores = {1: 0, 2: 0};
let filledBoxes = 0;
const totalBoxes = (GRID_DOTS - 1) * (GRID_DOTS - 1);
const lines = {};               // "h-r-c"/"v-r-c" => true/false
const boxes = [];               // list of {r,c,el,owner}

const container   = document.getElementById('game-container');
const popup       = document.getElementById('popup');
const winnerText  = document.getElementById('winner-text');
const restartBtn  = document.getElementById('restart');

// Utility: set container size so centering works
function setContainerSize(){
  const side = (GRID_DOTS - 1) * SPACING + DOT; // last dot edge to edge
  container.style.width  = `${side}px`;
  container.style.height = `${side}px`;
}

// Place a dot centered at (cx, cy)
function placeDot(r, c){
  const cx = c * SPACING, cy = r * SPACING;
  const el = document.createElement('div');
  el.className = 'dot';
  el.style.left = `${cx - DOT/2}px`;
  el.style.top  = `${cy - DOT/2}px`;
  container.appendChild(el);
}

// Create a horizontal line between (r,c) and (r,c+1)
function placeHLine(r, c){
  const el = document.createElement('div');
  el.className = 'line horizontal available';
  el.dataset.type = 'h'; el.dataset.r = r; el.dataset.c = c;

  const y = r * SPACING;
  const x = c * SPACING;

  el.style.left = `${x + DOT/2}px`;
  el.style.top  = `${y - LINE_THK/2}px`;
  el.style.width = `${SPACING - DOT}px`;

  el.addEventListener('click', onLineClick);
  container.appendChild(el);
  lines[`h-${r}-${c}`] = false;
}

// Create a vertical line between (r,c) and (r+1,c)
function placeVLine(r, c){
  const el = document.createElement('div');
  el.className = 'line vertical available';
  el.dataset.type = 'v'; el.dataset.r = r; el.dataset.c = c;

  const y = r * SPACING;
  const x = c * SPACING;

  el.style.left  = `${x - LINE_THK/2}px`;
  el.style.top   = `${y + DOT/2}px`;
  el.style.height = `${SPACING - DOT}px`;

  el.addEventListener('click', onLineClick);
  container.appendChild(el);
  lines[`v-${r}-${c}`] = false;
}

// Create box area (for color fill when claimed)
function placeBox(r, c){
  const el = document.createElement('div');
  el.className = 'box';
  const x = c * SPACING, y = r * SPACING;
  el.style.left   = `${x + DOT/2}px`;
  el.style.top    = `${y + DOT/2}px`;
  el.style.width  = `${SPACING - DOT}px`;
  el.style.height = `${SPACING - DOT}px`;
  container.appendChild(el);
  boxes.push({ r, c, el, owner: null });
}

function buildBoard(){
  container.innerHTML = '';
  scores[1] = scores[2] = 0;
  filledBoxes = 0;

  setContainerSize();

  for(let r=0; r<GRID_DOTS; r++){
    for(let c=0; c<GRID_DOTS; c++){
      placeDot(r,c);
      if(c < GRID_DOTS - 1) placeHLine(r,c);
      if(r < GRID_DOTS - 1) placeVLine(r,c);
      if(r < GRID_DOTS - 1 && c < GRID_DOTS - 1) placeBox(r,c);
    }
  }
}

function onLineClick(e){
  const el = e.currentTarget;
  if(!el.classList.contains('available')) return; // taken already

  el.classList.remove('available');
  el.classList.add('taken');
  const key = `${el.dataset.type}-${el.dataset.r}-${el.dataset.c}`;
  lines[key] = true;

  // color by player
  el.style.background = currentPlayer === 1 ? '#1f78ff' : '#ff3b3b';

  // Did this complete one or more boxes?
  const madeBox = markCompletedBoxes();
  if(!madeBox){
    currentPlayer = currentPlayer === 1 ? 2 : 1;
  }

  if(filledBoxes === totalBoxes){
    showWinner();
  }
}

function markCompletedBoxes(){
  let any = false;
  for(const b of boxes){
    if(b.owner) continue;

    const top    = lines[`h-${b.r}-${b.c}`];
    const bottom = lines[`h-${b.r+1}-${b.c}`];
    const left   = lines[`v-${b.r}-${b.c}`];
    const right  = lines[`v-${b.r}-${b.c+1}`];

    if(top && bottom && left && right){
      b.owner = currentPlayer;
      b.el.style.background = currentPlayer === 1 ? 'rgba(31,120,255,0.35)'
                                                  : 'rgba(255,59,59,0.35)';
      scores[currentPlayer] += 1;
      filledBoxes += 1;
      any = true;
    }
  }
  return any;
}

function showWinner(){
  let text;
  if(scores[1] > scores[2]) text = `Player 1 Wins!\nP1: ${scores[1]}  |  P2: ${scores[2]}`;
  else if(scores[2] > scores[1]) text = `Player 2 Wins!\nP1: ${scores[1]}  |  P2: ${scores[2]}`;
  else text = `It's a Draw!\nP1: ${scores[1]}  |  P2: ${scores[2]}`;
  winnerText.textContent = text;
  popup.style.display = 'flex';
}

restartBtn.addEventListener('click', ()=>{
  popup.style.display = 'none';
  buildBoard();
});

// init
buildBoard();
