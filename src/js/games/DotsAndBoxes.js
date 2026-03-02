/**
 * DotsAndBoxes - Integrated from my_games/Dots&Boxes
 * Complete dots and boxes game with 6x6 grid
 */
export class DotsAndBoxes {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.boardElement = null;
        this.sessionStartTime = null;
        this.moveCount = 0;
    }

    async init() {
        this.sessionStartTime = Date.now();
        this.moveCount = 0;
        console.log('DotsAndBoxes initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) this.boardElement = boardElement;
        if (!this.boardElement) return;

        // If wrapper exists, the game is already running. Do not re-init.
        if (this.boardElement.querySelector('.dab-wrapper')) {
            return;
        }

        this.boardElement.innerHTML = '';
        this._addStyles();

        this.boardElement.innerHTML = `
            <div class="dab-wrapper">
                <div class="dab-header">
                    <div class="dab-player dab-p1 active" id="dab-p1">
                        <span>Player 1</span>
                        <span class="dab-score" id="dab-score-1">0</span>
                    </div>
                    <div class="dab-turn" id="dab-turn">Player 1's Turn</div>
                    <div class="dab-player dab-p2" id="dab-p2">
                        <span>Player 2</span>
                        <span class="dab-score" id="dab-score-2">0</span>
                    </div>
                </div>
                <div class="dab-game-container" id="dab-container"></div>
                <button id="dab-restart" class="dab-btn">New Game</button>
                <div class="dab-popup hidden" id="dab-popup">
                    <div class="dab-popup-inner">
                        <div id="dab-winner-text" class="dab-winner-text"></div>
                        <button id="dab-popup-restart" class="dab-btn">Play Again</button>
                    </div>
                </div>
            </div>
        `;

        this._initEngine();
    }

    _addStyles() {
        if (document.getElementById('dab-styles')) return;
        const style = document.createElement('style');
        style.id = 'dab-styles';
        style.textContent = `
            .dab-wrapper { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; font-family: inherit; position: relative; }
            .dab-header { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 500px; }
            .dab-player { display: flex; flex-direction: column; align-items: center; padding: 0.75rem 1.25rem; border-radius: 12px; background: #f0f0f0; transition: all 0.3s; opacity: 0.6; }
            .dab-player.active { opacity: 1; transform: scale(1.05); }
            .dab-p1.active { background: linear-gradient(135deg, #1f78ff, #0056cc); color: white; }
            .dab-p2.active { background: linear-gradient(135deg, #ff3b3b, #cc0000); color: white; }
            .dab-score { font-size: 1.5rem; font-weight: 700; }
            .dab-turn { font-weight: 600; }
            .dab-game-container { position: relative; }
            .dot { position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #333; transform: translate(-50%, -50%); z-index: 2; }
            .line { position: absolute; cursor: pointer; border-radius: 5px; z-index: 1; }
            .line.horizontal { height: 10px; }
            .line.vertical { width: 10px; }
            .line.available { background: rgba(0,0,0,0.1); }
            .line.available:hover { background: rgba(0,0,0,0.3); }
            .line.taken { cursor: default; }
            .box { position: absolute; border-radius: 3px; transition: background 0.3s; }
            .dab-btn { padding: 0.5rem 1.5rem; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: 600; cursor: pointer; font-family: inherit; }
            .dab-popup { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; border-radius: 12px; z-index: 10; }
            .dab-popup.hidden { display: none; }
            .dab-popup-inner { background: white; border-radius: 16px; padding: 2rem; text-align: center; display: flex; flex-direction: column; gap: 1rem; }
            .dab-winner-text { font-size: 1.4rem; font-weight: 700; }
        `;
        document.head.appendChild(style);
    }

    _initEngine() {
        const GRID_DOTS = 7;
        const SPACING = 55;
        const DOT = 14;
        const LINE_THK = 10;
        const totalBoxes = (GRID_DOTS - 1) * (GRID_DOTS - 1);

        const container = this.boardElement.querySelector('#dab-container');
        const popup = this.boardElement.querySelector('#dab-popup');
        const winnerText = this.boardElement.querySelector('#dab-winner-text');
        const restartBtn = this.boardElement.querySelector('#dab-restart');
        const popupRestartBtn = this.boardElement.querySelector('#dab-popup-restart');
        const eventBus = this.eventBus;
        const self = this;

        let currentPlayer = 1;
        let scores = {1: 0, 2: 0};
        let filledBoxes = 0;
        let lines = {};
        let boxes = [];

        restartBtn.addEventListener('click', buildBoard);
        popupRestartBtn.addEventListener('click', () => { popup.classList.add('hidden'); buildBoard(); });

        buildBoard();

        function buildBoard() {
            container.innerHTML = '';
            scores[1] = scores[2] = 0;
            filledBoxes = 0;
            lines = {};
            boxes = [];
            self.moveCount = 0;
            self.sessionStartTime = Date.now();

            const side = (GRID_DOTS - 1) * SPACING + DOT;
            container.style.width = `${side}px`;
            container.style.height = `${side}px`;
            container.style.position = 'relative';

            for (let r = 0; r < GRID_DOTS; r++) {
                for (let c = 0; c < GRID_DOTS; c++) {
                    placeDot(r, c);
                    if (c < GRID_DOTS - 1) placeHLine(r, c);
                    if (r < GRID_DOTS - 1) placeVLine(r, c);
                    if (r < GRID_DOTS - 1 && c < GRID_DOTS - 1) placeBox(r, c);
                }
            }
            updateDisplay(1);
        }

        function placeDot(r, c) {
            const el = document.createElement('div');
            el.className = 'dot';
            el.style.left = `${c * SPACING}px`;
            el.style.top = `${r * SPACING}px`;
            container.appendChild(el);
        }

        function placeHLine(r, c) {
            const el = document.createElement('div');
            el.className = 'line horizontal available';
            el.dataset.type = 'h'; el.dataset.r = r; el.dataset.c = c;
            el.style.left = `${c * SPACING + DOT/2}px`;
            el.style.top = `${r * SPACING - LINE_THK/2}px`;
            el.style.width = `${SPACING - DOT}px`;
            el.addEventListener('click', onLineClick);
            container.appendChild(el);
            lines[`h-${r}-${c}`] = false;
        }

        function placeVLine(r, c) {
            const el = document.createElement('div');
            el.className = 'line vertical available';
            el.dataset.type = 'v'; el.dataset.r = r; el.dataset.c = c;
            el.style.left = `${c * SPACING - LINE_THK/2}px`;
            el.style.top = `${r * SPACING + DOT/2}px`;
            el.style.height = `${SPACING - DOT}px`;
            el.addEventListener('click', onLineClick);
            container.appendChild(el);
            lines[`v-${r}-${c}`] = false;
        }

        function placeBox(r, c) {
            const el = document.createElement('div');
            el.className = 'box';
            el.style.left = `${c * SPACING + DOT/2}px`;
            el.style.top = `${r * SPACING + DOT/2}px`;
            el.style.width = `${SPACING - DOT}px`;
            el.style.height = `${SPACING - DOT}px`;
            container.appendChild(el);
            boxes.push({ r, c, el, owner: null });
        }

        function onLineClick(e) {
            const el = e.currentTarget;
            if (!el.classList.contains('available')) return;
            el.classList.remove('available');
            el.classList.add('taken');
            const key = `${el.dataset.type}-${el.dataset.r}-${el.dataset.c}`;
            lines[key] = true;
            el.style.background = currentPlayer === 1 ? '#1f78ff' : '#ff3b3b';
            self.moveCount++;

            const madeBox = markCompletedBoxes();
            if (!madeBox) currentPlayer = currentPlayer === 1 ? 2 : 1;

            updateDisplay(currentPlayer);

            if (filledBoxes === totalBoxes) showWinner();
        }

        function markCompletedBoxes() {
            let any = false;
            for (const b of boxes) {
                if (b.owner) continue;
                const top = lines[`h-${b.r}-${b.c}`];
                const bottom = lines[`h-${b.r+1}-${b.c}`];
                const left = lines[`v-${b.r}-${b.c}`];
                const right = lines[`v-${b.r}-${b.c+1}`];
                if (top && bottom && left && right) {
                    b.owner = currentPlayer;
                    b.el.style.background = currentPlayer === 1 ? 'rgba(31,120,255,0.35)' : 'rgba(255,59,59,0.35)';
                    scores[currentPlayer] += 1;
                    filledBoxes += 1;
                    any = true;
                }
            }
            return any;
        }

        function updateDisplay(player) {
            const s1 = self.boardElement.querySelector('#dab-score-1');
            const s2 = self.boardElement.querySelector('#dab-score-2');
            const turn = self.boardElement.querySelector('#dab-turn');
            const p1 = self.boardElement.querySelector('#dab-p1');
            const p2 = self.boardElement.querySelector('#dab-p2');
            if (s1) s1.textContent = scores[1];
            if (s2) s2.textContent = scores[2];
            if (turn) turn.textContent = `Player ${player}'s Turn`;
            if (p1) p1.classList.toggle('active', player === 1);
            if (p2) p2.classList.toggle('active', player === 2);
        }

        function showWinner() {
            let text, winner;
            if (scores[1] > scores[2]) { text = `Player 1 Wins! (${scores[1]} vs ${scores[2]})`; winner = 1; }
            else if (scores[2] > scores[1]) { text = `Player 2 Wins! (${scores[2]} vs ${scores[1]})`; winner = 2; }
            else { text = `It's a Draw! (${scores[1]} each)`; winner = 'draw'; }
            winnerText.textContent = text;
            popup.classList.remove('hidden');

            const duration = Date.now() - (self.sessionStartTime || Date.now());
            eventBus?.emit('game:end', {
                gameId: 'dotsandboxes',
                winner,
                winReason: text,
                moveCount: self.moveCount,
                sessionDuration: duration,
                scores: { 1: scores[1], 2: scores[2] }
            });
        }
    }

    getState() { return { currentPlayer: 1, gameActive: true }; }
    makeMove() { return { valid: false }; }
    cleanup() { if (this.boardElement) this.boardElement.innerHTML = ''; }
}
