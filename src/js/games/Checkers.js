/**
 * Checkers - Integrated from my_games/checkers
 * Full checkers game with forced captures, king pieces, and chain jumps
 */
export class Checkers {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.boardElement = null;
        this.engine = null;
        this.sessionStartTime = null;
        this.moveCount = 0;
    }

    async init() {
        this.sessionStartTime = Date.now();
        this.moveCount = 0;
        console.log('Checkers initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) this.boardElement = boardElement;
        if (!this.boardElement) return;

        // If wrapper exists, the game is already running. Do not re-init.
        if (this.boardElement.querySelector('.checkers-wrapper')) {
            return;
        }

        this.boardElement.innerHTML = '';

        // Inject styles
        this._addStyles();

        // Build the game HTML
        this.boardElement.innerHTML = `
            <div class="checkers-wrapper">
                <div class="checkers-header">
                    <div class="checkers-turn">
                        <div class="token red" id="ck-turnToken"></div>
                        <span id="ck-turnLabel">Red's Turn</span>
                    </div>
                    <button id="ck-resetBtn" class="ck-btn">New Game</button>
                </div>
                <div class="checkers-board-grid" id="ck-boardGrid"></div>
                <div class="ck-winner-popup hidden" id="ck-winnerPopup">
                    <div class="ck-popup-inner">
                        <div id="ck-winnerText" class="ck-winner-text"></div>
                        <button id="ck-popupResetBtn" class="ck-btn">Play Again</button>
                    </div>
                </div>
            </div>
        `;

        this._initEngine();
    }

    _addStyles() {
        if (document.getElementById('ck-styles')) return;
        const style = document.createElement('style');
        style.id = 'ck-styles';
        style.textContent = `
            .checkers-wrapper { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; font-family: inherit; }
            .checkers-header { display: flex; align-items: center; gap: 1rem; }
            .checkers-turn { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
            .token { width: 28px; height: 28px; border-radius: 50%; border: 3px solid rgba(0,0,0,0.3); }
            .token.red { background: radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b); }
            .token.blue { background: radial-gradient(circle at 35% 35%, #74b9ff, #2980b9); }
            .checkers-board-grid { display: grid; grid-template-columns: repeat(8, 1fr); width: min(480px, 90vw); height: min(480px, 90vw); border: 3px solid #333; border-radius: 4px; overflow: hidden; position: relative; }
            .square { display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; }
            .square.light { background: #f0d9b5; }
            .square.dark { background: #b58863; }
            .square.move-target { background: rgba(100,200,100,0.5) !important; }
            .square.capture-target { background: rgba(255,80,80,0.5) !important; }
            .square.must-capture { outline: 3px solid gold; outline-offset: -3px; }
            .piece { width: 75%; height: 75%; border-radius: 50%; border: 3px solid rgba(0,0,0,0.4); cursor: pointer; transition: transform 0.15s; position: relative; }
            .piece:hover { transform: scale(1.1); }
            .piece.red { background: radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b); }
            .piece.blue { background: radial-gradient(circle at 35% 35%, #74b9ff, #2980b9); }
            .piece.selected { box-shadow: 0 0 0 4px gold; }
            .piece.king::after { content: '♛'; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 1.1rem; color: gold; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
            .ck-btn { padding: 0.5rem 1.2rem; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: 600; cursor: pointer; font-family: inherit; }
            .ck-btn:hover { opacity: 0.9; }
            .ck-winner-popup { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; border-radius: 4px; z-index: 10; }
            .ck-winner-popup.hidden { display: none; }
            .ck-popup-inner { background: white; border-radius: 16px; padding: 2rem; text-align: center; display: flex; flex-direction: column; gap: 1rem; }
            .ck-winner-text { font-size: 1.5rem; font-weight: 700; }
        `;
        document.head.appendChild(style);
    }

    _initEngine() {
        const wrapper = this.boardElement.querySelector('.checkers-wrapper');
        const boardGrid = this.boardElement.querySelector('#ck-boardGrid');
        const turnToken = this.boardElement.querySelector('#ck-turnToken');
        const turnLabel = this.boardElement.querySelector('#ck-turnLabel');
        const resetBtn = this.boardElement.querySelector('#ck-resetBtn');
        const winnerPopup = this.boardElement.querySelector('#ck-winnerPopup');
        const winnerText = this.boardElement.querySelector('#ck-winnerText');
        const popupResetBtn = this.boardElement.querySelector('#ck-popupResetBtn');

        const eventBus = this.eventBus;
        const self = this;

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

        function init() {
            self.moveCount = 0;
            self.sessionStartTime = Date.now();
            createModel();
            selected = null;
            chaining = false;
            forcedCaptureSquares = computeForcedCaptures(turn);
            render();
            updateTurnToken();
        }

        function createModel() {
            board = Array.from({length:8}, () => Array(8).fill(null));
            for (let r=0; r<8; r++) {
                for (let c=0; c<8; c++) {
                    if ((r+c)%2 === 1) {
                        if (r < 3) board[r][c] = {color:'blue', king:false};
                        else if (r > 4) board[r][c] = {color:'red', king:false};
                    }
                }
            }
            forcedCaptureSquares = computeForcedCaptures(turn);
        }

        function render() {
            boardGrid.innerHTML = '';
            forcedCaptureSquares = computeForcedCaptures(turn);
            for (let r=0; r<8; r++) {
                for (let c=0; c<8; c++) {
                    const sq = document.createElement('div');
                    sq.className = 'square ' + (((r+c)%2===0) ? 'light' : 'dark');
                    sq.dataset.row = r; sq.dataset.col = c;
                    const piece = board[r][c];
                    if (piece) {
                        const p = document.createElement('div');
                        p.className = 'piece ' + piece.color + (piece.king ? ' king' : '');
                        if (forcedCaptureSquares.some(s => s.r===r && s.c===c)) sq.classList.add('must-capture');
                        if (selected && selected.row===r && selected.col===c) p.classList.add('selected');
                        sq.appendChild(p);
                    }
                    sq.addEventListener('click', () => onSquareClick(r,c));
                    boardGrid.appendChild(sq);
                }
            }
            if (selected) showMoves(selected.row, selected.col);
            checkWinner();
        }

        function onSquareClick(r,c) {
            if (chaining) {
                const captureMoves = getCaptureMovesForPiece(selected.row, selected.col, board[selected.row][selected.col].king);
                const move = captureMoves.find(m => m.to.r===r && m.to.c===c);
                if (move) { performMove(move); return; }
                return;
            }
            const piece = board[r][c];
            if (piece && piece.color === turn) {
                // If forced captures exist, only allow selecting a piece that has a capture
                if (forcedCaptureSquares.length > 0 && !forcedCaptureSquares.some(s => s.r===r && s.c===c)) return;
                selected = {row:r,col:c}; render(); return;
            }
            if (selected) {
                let valid = computeValidMoves(selected.row, selected.col);
                // If forced captures exist, only allow capture moves
                if (forcedCaptureSquares.length > 0) {
                    valid = valid.filter(m => m.capture);
                }
                const chosen = valid.find(m => m.to.r===r && m.to.c===c);
                if (chosen) { performMove(chosen); }
                else { selected = null; clearHighlights(); render(); }
            }
        }

        function computeForcedCaptures(playerColor) {
            const res = [];
            for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
                const p = board[r][c];
                if (p && p.color===playerColor && pieceHasCapture(r,c,p.king)) res.push({r,c});
            }
            return res;
        }

        function pieceHasCapture(r,c,isKing) {
            const piece = board[r][c]; if (!piece) return false;
            const dirs = getDirs(piece.color, isKing);
            for (const [dr,dc] of dirs) {
                const midR=r+dr, midC=c+dc, toR=r+2*dr, toC=c+2*dc;
                if (inBounds(toR,toC) && inBounds(midR,midC) && board[toR][toC]===null) {
                    const mid = board[midR][midC];
                    if (mid && mid.color !== piece.color) return true;
                }
            }
            return false;
        }

        function getDirs(color, isKing) {
            const forward = color==='red' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
            const backward = color==='red' ? [[1,-1],[1,1]] : [[-1,-1],[-1,1]];
            return isKing ? forward.concat(backward) : forward;
        }

        function computeValidMoves(r,c) {
            const piece = board[r][c]; if (!piece) return [];
            const dirs = getDirs(piece.color, piece.king);
            const moves = [];
            for (const [dr,dc] of dirs) {
                const midR=r+dr, midC=c+dc, toR=r+2*dr, toC=c+2*dc;
                if (inBounds(toR,toC) && inBounds(midR,midC) && board[toR][toC]===null) {
                    const mid = board[midR][midC];
                    if (mid && mid.color !== piece.color) moves.push({from:{r,c}, to:{r:toR,c:toC}, captures:[{r:midR,c:midC}]});
                }
            }
            for (const [dr,dc] of dirs) {
                const toR=r+dr, toC=c+dc;
                if (inBounds(toR,toC) && board[toR][toC]===null) moves.push({from:{r,c}, to:{r:toR,c:toC}, captures:[]});
            }
            return moves;
        }

        function getCaptureMovesForPiece(r,c,isKing) {
            const piece = board[r][c]; if (!piece) return [];
            const dirs = getDirs(piece.color, isKing);
            const results = [];
            for (const [dr,dc] of dirs) {
                const midR=r+dr, midC=c+dc, toR=r+2*dr, toC=c+2*dc;
                if (inBounds(toR,toC) && inBounds(midR,midC) && board[toR][toC]===null) {
                    const mid = board[midR][midC];
                    if (mid && mid.color !== piece.color) results.push({from:{r,c}, to:{r:toR,c:toC}, captures:[{r:midR,c:midC}]});
                }
            }
            return results;
        }

        function performMove(move) {
            const {from, to, captures} = move;
            const piece = board[from.r][from.c]; if (!piece) return;
            board[to.r][to.c] = piece; board[from.r][from.c] = null;
            if (captures && captures.length) for (const cap of captures) board[cap.r][cap.c] = null;
            if (piece.color==='red' && to.r===0) piece.king = true;
            if (piece.color==='blue' && to.r===7) piece.king = true;
            self.moveCount++;
            if (captures && captures.length) {
                const more = pieceHasCapture(to.r, to.c, piece.king);
                if (more) { selected = {row:to.r, col:to.c}; chaining = true; render(); return; }
            }
            chaining = false; selected = null;
            turn = (turn==='red') ? 'blue' : 'red';
            forcedCaptureSquares = computeForcedCaptures(turn);
            updateTurnToken(); render();
        }

        function showMoves(r,c) {
            clearHighlights();
            const moves = computeValidMoves(r,c);
            moves.forEach(m => {
                const el = getSquareEl(m.to.r, m.to.c);
                if (m.captures && m.captures.length) el.classList.add('capture-target');
                else el.classList.add('move-target');
            });
        }

        function getSquareEl(r,c) { return boardGrid.children[r*8+c]; }
        function inBounds(r,c) { return r>=0 && r<8 && c>=0 && c<8; }

        function clearHighlights() {
            Array.from(boardGrid.children).forEach(ch => ch.classList.remove('move-target','capture-target','must-capture'));
            forcedCaptureSquares.forEach(s => { const el=getSquareEl(s.r,s.c); if(el) el.classList.add('must-capture'); });
        }

        function updateTurnToken() {
            turnToken.className = 'token ' + turn;
            turnLabel.textContent = turn === 'red' ? "Red's Turn" : "Blue's Turn";
        }

        function getAllPieces(color) {
            const pieces = [];
            for (let r=0; r<8; r++) for (let c=0; c<8; c++) if (board[r][c] && board[r][c].color===color) pieces.push({r,c});
            return pieces;
        }

        function hasAnyMoves(color) {
            return getAllPieces(color).some(p => computeValidMoves(p.r,p.c).length > 0);
        }

        function checkWinner() {
            const redPieces = getAllPieces('red');
            const bluePieces = getAllPieces('blue');
            if (redPieces.length===0) { showWinner('Blue Wins! 🔵'); return; }
            if (bluePieces.length===0) { showWinner('Red Wins! 🔴'); return; }
            if (!hasAnyMoves('red')) { showWinner('Blue Wins! 🔵'); return; }
            if (!hasAnyMoves('blue')) { showWinner('Red Wins! 🔴'); return; }
        }

        function showWinner(text) {
            winnerText.textContent = text;
            winnerPopup.classList.remove('hidden');
            const winner = text.includes('Red') ? 1 : 2;
            const duration = Date.now() - (self.sessionStartTime || Date.now());
            eventBus?.emit('game:end', {
                gameId: 'checkers',
                winner,
                winReason: text,
                moveCount: self.moveCount,
                sessionDuration: duration,
                scores: { 1: winner === 1 ? 1 : 0, 2: winner === 2 ? 1 : 0 }
            });
        }
    }

    getState() { return { currentPlayer: 1, gameActive: true }; }
    makeMove() { return { valid: false }; }
    cleanup() { if (this.boardElement) this.boardElement.innerHTML = ''; }
}
