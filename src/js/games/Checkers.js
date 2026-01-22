const boardGrid = document.getElementById('boardGrid');
const turnToken = document.getElementById('turnToken');
const resetBtn = document.getElementById('resetBtn');
const winnerPopup = document.getElementById('winnerPopup');
const winnerText = document.getElementById('winnerText');
const popupResetBtn = document.getElementById('popupResetBtn');

let board = [];
let selected = null;
let forcedCaptureSquares = [];
let turn = 'red';
let chaining = false;

resetBtn.addEventListener('click', init);
popupResetBtn.addEventListener('click', () => {
  winnerPopup.classList.add('hidden');
  init();
});

init();

function init(){
  createModel();
  selected = null;
  chaining = false;
  forcedCaptureSquares = computeForcedCaptures(turn);
  render();
  updateTurnToken();
}

function createModel(){
  board = Array.from({length:8}, ()=>Array(8).fill(null));
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      if((r+c)%2 === 1){
        if(r < 3) board[r][c] = {color:'blue', king:false};
        else if(r > 4) board[r][c] = {color:'red', king:false};
      }
    }
  }
  forcedCaptureSquares = computeForcedCaptures(turn);
}

function render(){
  boardGrid.innerHTML = '';
  forcedCaptureSquares = computeForcedCaptures(turn);

  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const sq = document.createElement('div');
      sq.className = 'square ' + (((r+c)%2===0) ? 'light' : 'dark');
      sq.dataset.row = r; sq.dataset.col = c;

      const piece = board[r][c];
      if(piece){
        const p = document.createElement('div');
        p.className = 'piece ' + piece.color + (piece.king ? ' king' : '');
        if(forcedCaptureSquares.some(s=>s.r===r && s.c===c)) {
          sq.classList.add('must-capture');
        }
        if(selected && selected.row===r && selected.col===c) p.classList.add('selected');
        sq.appendChild(p);
      }

      sq.addEventListener('click', ()=>onSquareClick(r,c));
      boardGrid.appendChild(sq);
    }
  }

  // Keep highlights visible for selected piece
  if(selected) {
    showMoves(selected.row, selected.col);
  }

  checkWinner(); // <-- Winner check every render
}

function onSquareClick(r,c){
  if(chaining){
    const captureMoves = getCaptureMovesForPiece(selected.row, selected.col, board[selected.row][selected.col].king);
    const move = captureMoves.find(m => m.to.r===r && m.to.c===c);
    if(move){
      performMove(move);
      return;
    }
    return;
  }

  const piece = board[r][c];

  if(piece && piece.color === turn){
    selected = {row:r,col:c};
    render();
    return;
  }

  if(selected){
    const valid = computeValidMoves(selected.row, selected.col);
    const chosen = valid.find(m => m.to.r===r && m.to.c===c);
    if(chosen){
      performMove(chosen);
    } else {
      selected = null;
      clearHighlights();
      render();
    }
  }
}

function computeForcedCaptures(playerColor){
  const res = [];
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const p = board[r][c];
      if(p && p.color===playerColor){
        if(pieceHasCapture(r,c,p.king)) res.push({r,c});
      }
    }
  }
  return res;
}

function pieceHasCapture(r,c,isKing){
  const piece = board[r][c];
  if(!piece) return false;
  const dirs = getDirs(piece.color, isKing);
  for(const [dr,dc] of dirs){
    const midR = r + dr, midC = c + dc;
    const toR = r + 2*dr, toC = c + 2*dc;
    if(inBounds(toR,toC) && inBounds(midR,midC) && board[toR][toC]===null){
      const mid = board[midR][midC];
      if(mid && mid.color !== piece.color) return true;
    }
  }
  return false;
}

function getDirs(color,isKing){
  const forward = color==='red' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  const backward = color==='red' ? [[1,-1],[1,1]] : [[-1,-1],[-1,1]];
  return isKing ? forward.concat(backward) : forward;
}

function computeValidMoves(r,c){
  const piece = board[r][c];
  if(!piece) return [];
  const dirs = getDirs(piece.color, piece.king);
  const moves = [];

  for(const [dr,dc] of dirs){
    const midR = r + dr, midC = c + dc;
    const toR = r + 2*dr, toC = c + 2*dc;
    if(inBounds(toR,toC) && inBounds(midR,midC) && board[toR][toC] === null){
      const mid = board[midR][midC];
      if(mid && mid.color !== piece.color){
        moves.push({from:{r,c}, to:{r:toR,c:toC}, captures:[{r:midR,c:midC}]});
      }
    }
  }

  for(const [dr,dc] of dirs){
    const toR = r + dr, toC = c + dc;
    if(inBounds(toR,toC) && board[toR][toC] === null){
      moves.push({from:{r,c}, to:{r:toR,c:toC}, captures:[]});
    }
  }
  return moves;
}

function getCaptureMovesForPiece(r,c,isKing){
  const piece = board[r][c];
  if(!piece) return [];
  const dirs = getDirs(piece.color, isKing);
  const results = [];
  for(const [dr,dc] of dirs){
    const midR = r + dr, midC = c + dc;
    const toR = r + 2*dr, toC = c + 2*dc;
    if(inBounds(toR,toC) && inBounds(midR,midC) && board[toR][toC] === null){
      const mid = board[midR][midC];
      if(mid && mid.color !== piece.color) {
        results.push({from:{r,c}, to:{r:toR,c:toC}, captures:[{r:midR,c:midC}]});
      }
    }
  }
  return results;
}

function performMove(move){
  const {from, to, captures} = move;
  const piece = board[from.r][from.c];
  if(!piece) return;

  board[to.r][to.c] = piece;
  board[from.r][from.c] = null;

  if(captures && captures.length){
    for(const cap of captures){
      board[cap.r][cap.c] = null;
    }
  }

  if(piece.color === 'red' && to.r === 0) piece.king = true;
  if(piece.color === 'blue' && to.r === 7) piece.king = true;

  if(captures && captures.length){
    const more = pieceHasCapture(to.r, to.c, piece.king);
    if(more){
      selected = {row:to.r, col:to.c};
      chaining = true;
      render();
      return;
    }
  }

  chaining = false;
  selected = null;
  turn = (turn === 'red') ? 'blue' : 'red';
  forcedCaptureSquares = computeForcedCaptures(turn);
  updateTurnToken();
  render();
}

function showMoves(r,c){
  clearHighlights();
  const piece = board[r][c];
  if(!piece) return;

  const moves = computeValidMoves(r,c);
  markMovesOnBoard(moves);
}

function markMovesOnBoard(moves){
  moves.forEach(m=>{
    const to = m.to;
    const el = getSquareEl(to.r,to.c);
    if(m.captures && m.captures.length) el.classList.add('capture-target');
    else el.classList.add('move-target');
  });
}

function getSquareEl(r,c){
  return boardGrid.children[r*8 + c];
}

function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

function clearHighlights(){
  Array.from(boardGrid.children).forEach(ch => {
    ch.classList.remove('move-target','capture-target','must-capture');
  });
  forcedCaptureSquares.forEach(s=>{
    const el = getSquareEl(s.r,s.c);
    if(el) el.classList.add('must-capture');
  });
}

function updateTurnToken(){
  turnToken.className = 'token ' + (turn === 'red' ? 'red' : 'blue');
}

/* --- NEW: Winner Check --- */
function checkWinner(){
  const redPieces = getAllPieces('red');
  const bluePieces = getAllPieces('blue');

  if(redPieces.length === 0){
    showWinner('Blue Wins!');
  } else if(bluePieces.length === 0){
    showWinner('Red Wins!');
  } else {
    const redHasMoves = hasAnyMoves('red');
    const blueHasMoves = hasAnyMoves('blue');
    if(!redHasMoves) showWinner('Blue Wins!');
    if(!blueHasMoves) showWinner('Red Wins!');
  }
}

function getAllPieces(color){
  const pieces = [];
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      if(board[r][c] && board[r][c].color === color){
        pieces.push({r,c});
      }
    }
  }
  return pieces;
}

function hasAnyMoves(color){
  const pieces = getAllPieces(color);
  return pieces.some(p => computeValidMoves(p.r,p.c).length > 0);
}

function showWinner(text){
  winnerText.textContent = text;
  winnerPopup.classList.remove('hidden');
}
