/**
 * SnakeAndLadders - Integrated from my_games/snake&ladder
 * Classic board game with snakes and ladders
 */
export class SnakeAndLadders {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.boardElement = null;
        this.sessionStartTime = null;
        this.moveCount = 0;
    }

    async init() {
        this.sessionStartTime = Date.now();
        this.moveCount = 0;
        console.log('SnakeAndLadders initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) this.boardElement = boardElement;
        if (!this.boardElement) return;

        // If wrapper exists, the game is already running. Do not re-init.
        if (this.boardElement.querySelector('.snl-wrapper')) {
            return;
        }

        this.boardElement.innerHTML = '';
        this._addStyles();
        this._initEngine();
    }

    _addStyles() {
        if (document.getElementById('snl-styles')) return;
        const style = document.createElement('style');
        style.id = 'snl-styles';
        style.textContent = `
            .snl-wrapper { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                gap: 2rem; 
                width: 100%; 
                max-width: 900px; /* Limit width */
                margin: 0 auto;   /* Center in parent */
            }
            .snl-main { 
                display: flex; 
                gap: 2rem; 
                flex-direction: column;
                align-items: center;
                width: 100%;
            }
            .snl-board-container {
                position: relative;
                width: min(500px, 90vw);
                aspect-ratio: 1;
                border: 4px solid #333;
                border-radius: 8px;
                background: #fff;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .snl-board { 
                display: grid; 
                grid-template-columns: repeat(10, 1fr); 
                grid-template-rows: repeat(10, 1fr);
                width: 100%; 
                height: 100%;
            }
            .snl-cell { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 0.7rem; 
                font-weight: 700; 
                position: relative; 
                border: 1px solid rgba(0,0,0,0.05);
            }
            .snl-cell:nth-child(odd) { background: #fff; }
            .snl-cell:nth-child(even) { background: rgba(0,0,0,0.02); }
            
            /* Color coding for start/end points */
            .snl-cell.snake-head { background-color: #fecaca !important; } /* Red tint */
            .snl-cell.ladder-start { background-color: #bbf7d0 !important; } /* Green tint */

            .snl-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10;
            }
            .snl-cell-num { 
                position: absolute; 
                top: 2px; 
                left: 4px; 
                font-size: 0.6rem; 
                color: #999; 
            }
            .snl-piece { 
                width: 60%; 
                height: 60%; 
                border-radius: 50%; 
                border: 2px solid white; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: absolute;
                transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                z-index: 20;
            }
            .snl-piece.p1 { background: radial-gradient(circle at 30% 30%, #ef4444, #b91c1c); transform: translate(-30%, -30%); }
            .snl-piece.p2 { background: radial-gradient(circle at 30% 30%, #3b82f6, #1d4ed8); transform: translate(30%, 30%); }
            
            /* Sidebar styles */
            /* Controls styles */
            .snl-controls {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                width: 100%;
                max-width: 500px;
                padding: 1rem;
                background: #f8fafc; /* Subtle bg for controls */
                border-radius: 8px;
            }
            .snl-dice-container {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .snl-dice {
                font-size: 3rem;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 60px;
                height: 60px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                transition: transform 0.3s ease;
            }
            .snl-btn {
                padding: 0.75rem 2rem;
                font-size: 1.1rem;
                font-weight: 600;
                color: white;
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
            }
            .snl-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.4);
            }
            .snl-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            .snl-log {
                font-size: 0.9rem;
                color: #64748b;
                font-style: italic;
                min-width: 150px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    _initEngine() {
        const SNAKES = { 97: 78, 95: 56, 88: 24, 62: 18, 48: 26, 36: 6, 32: 10 };
        const LADDERS = { 1: 38, 4: 14, 9: 31, 20: 42, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 };
        const eventBus = this.eventBus;
        const self = this;

        const wrapper = document.createElement('div');
        wrapper.className = 'snl-wrapper';
        let positions = [0, 0]; // 0-indexed players
        let currentPlayer = 0;
        let gameOver = false;

        wrapper.innerHTML = `
            <div class="snl-main">
                <div class="snl-board-container">
                    <div class="snl-board" id="snl-board"></div>
                    <svg class="snl-overlay" id="snl-overlay" width="100%" height="100%"></svg>
                </div>
                
                <div class="snl-controls">
                    <div class="snl-dice-container">
                        <div class="snl-dice" id="snl-dice">🎲</div>
                        <div class="snl-log" id="snl-log">Waiting for roll...</div>
                    </div>
                    <button id="snl-roll" class="snl-btn btn-primary">Roll Dice</button>
                    <button id="snl-restart" class="snl-btn btn-primary" style="display:none;">New Game</button>
                </div>
            </div>
            <div class="snl-winner-banner" id="snl-winner"></div>
        `;
        this.boardElement.appendChild(wrapper);

        const boardEl = wrapper.querySelector('#snl-board');
        const diceEl = wrapper.querySelector('#snl-dice');
        const rollBtn = wrapper.querySelector('#snl-roll');
        const restartBtn = wrapper.querySelector('#snl-restart');
        const logEl = wrapper.querySelector('#snl-log');
        const winnerEl = wrapper.querySelector('#snl-winner');

        if (rollBtn) rollBtn.addEventListener('click', rollDice);
        if (restartBtn) restartBtn.addEventListener('click', startGame);

        startGame();

        function startGame() {
            positions = [0, 0];
            currentPlayer = 0;
            gameOver = false;
            self.moveCount = 0;
            self.sessionStartTime = Date.now();
            logEl.innerHTML = '';
            winnerEl.style.display = 'none';
            rollBtn.disabled = false;
            rollBtn.style.display = '';
            if (restartBtn) restartBtn.style.display = 'none';
            renderBoard();
            updateCards();
        }


        function renderBoard() {
            boardEl.innerHTML = '';
            
            // Generate board numbers: Bottom-Left (1) to Top-Left (100) ZigZag
            // Row 0 (bottom) : 1..10 (L->R)
            // Row 1          : 20..11 (R->L)
            // Row 2          : 21..30 (L->R)
            // ...
            // Row 9 (top)    : 100..91 (R->L)
            
            // Used for CSS grid ordering. Grid is top-down (row 1 is top).
            // So visual row 9 is CSS row 1.
            
            for (let r = 9; r >= 0; r--) { // r=9 is top visual row (100..91)
                const isEvenRow = (r % 2 === 1); // 9 is odd
                // Standard board: Row 0 is bottom (1-10). Row 9 is top (91-100 or 100-91).
                // Let's explicitly calculate based on standard 1-100 orientation
                
                // Visual Row index (0=bottom, 9=top)
                // We are rendering CSS grid cells from Top-Left to Bottom-Right
                // CSS Row 0 (Visual Row 9)
                // CSS Row 9 (Visual Row 0)
                
                const visualRow = r; 
                const startNum = visualRow * 10 + 1;
                const endNum = startNum + 9;
                
                const cellsInRow = [];
                if (visualRow % 2 === 0) {
                    // Even visual row (0, 2...) -> Left to Right (1-10)
                    for (let n = startNum; n <= endNum; n++) cellsInRow.push(n);
                } else {
                    // Odd visual row (1, 3...) -> Right to Left (20-11)
                    for (let n = endNum; n >= startNum; n--) cellsInRow.push(n);
                }

                // Grid usually fills L-R, so for Odd visual rows (displayed R-L logically), 
                // we physically place them L-R but numbers must match the zigzag.
                // Wait, if visual row 1 is 20, 19...11 (R-L logic), then physically LEFTMOST cell is 20.
                // Let's re-verify standard board.
                // Row 0 (bottom): 1  2  3 ... 10
                // Row 1 (up)    : 20 19 18 ... 11
                // This means vertically, we iterate Top to Bottom (CSS Rows).
                // Top Row (Visual 9) -> If 9 is odd, it's 100 99 .. 91?
                // Visual Row 0 (Even) -> L->R.
                // Visual Row 1 (Odd) -> R->L.
                // ...
                // Visual Row 9 (Odd) -> R->L (100 -> 91).
                
                // So top row (CSS Row 0 / Visual Row 9) should contain 100, 99, ..., 91.
                // Leftmost cell is 100.
                
                cellsInRow.reverse(); // If I push 91..100, checking logical order...
                
                // Re-doing logic simply:
                // We create 100 DIVs. CSS Grid fills row by row.
                // We need the array of numbers to match exactly what should be in each cell from Top-Left to Bottom-Right.
                
                // Top Row (Visual 9, Odd): 100, 99, ..., 91
                // Row 8 (Even): 81, 82, ..., 90
                // Row 7 (Odd): 80, 79, ..., 71
                
                // My loop r goes 9 down to 0. Use 'r' as visual row index.
                let rowNums = [];
                if (r % 2 !== 0) {
                    // Odd row (9, 7...): 100->91, 80->71
                    // Range: (r*10 + 10) down to (r*10 + 1)
                    for (let c = 10; c >= 1; c--) rowNums.push(r * 10 + c);
                } else {
                    // Even row (8, 6...): 81->90
                    // Range: (r*10 + 1) up to (r*10 + 10)
                    for (let c = 1; c <= 10; c++) rowNums.push(r * 10 + c);
                }
                
                // Render cells
                rowNums.forEach(num => {
                    const cell = document.createElement('div');
                    cell.className = 'snl-cell';
                    cell.id = `snl-cell-${num}`;
                    if (SNAKES[num]) cell.classList.add('snake-head');
                    if (LADDERS[num]) cell.classList.add('ladder-start'); // Rename to ladder-start
                    
                    const numEl = document.createElement('span');
                    numEl.className = 'snl-cell-num';
                    numEl.textContent = num;
                    cell.appendChild(numEl);
                    boardEl.appendChild(cell);
                });
            }
            
            drawOverlay(); // Draw snakes/ladders
            placePieces();
        }

        function drawOverlay() {
            const svg = wrapper.querySelector('#snl-overlay');
            svg.innerHTML = ''; // Clear
            
            // Helper to get center coordinates of a cell number relative to SVG
            // We can't use getBoundingClientRect effectively during initial render safely? 
            // Better to use grid math. 
            // 10x10 grid.
            // visual row r (0..9). 0 is bottom.
            // visual col c (0..9). 0 is left.
            
            const getCoord = (num) => {
                const visualRow = Math.floor((num - 1) / 10);
                // If even row (0, 2..), starts Left. Col = (num-1)%10.
                // If odd row (1, 3..), starts Right. Col = 9 - ((num-1)%10).
                let col = (num - 1) % 10;
                if (visualRow % 2 !== 0) col = 9 - col;
                
                // CSS Rows are inverted relative to visual rows. 
                // Visual Row 9 is Top (y=0% + half cell).
                // Visual Row 0 is Bottom (y=90% + half cell).
                // y% = (9 - visualRow) * 10 + 5
                
                const x = col * 10 + 5; // Center of cell column
                const y = (9 - visualRow) * 10 + 5; // Center of cell row
                
                return { x: `${x}%`, y: `${y}%` };
            };
            
            // Draw Snakes
            Object.entries(SNAKES).forEach(([start, end]) => {
                const s = getCoord(parseInt(start));
                const e = getCoord(end);
                
                // Line
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', s.x);
                line.setAttribute('y1', s.y);
                line.setAttribute('x2', e.x);
                line.setAttribute('y2', e.y);
                line.setAttribute('stroke', '#ef4444');
                line.setAttribute('stroke-width', '4');
                line.setAttribute('stroke-linecap', 'round');
                line.style.opacity = '0.6';
                svg.appendChild(line);
                
                // Head marker (start)
                const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                head.setAttribute('cx', s.x);
                head.setAttribute('cy', s.y);
                head.setAttribute('r', '3');
                head.setAttribute('fill', '#b91c1c');
                svg.appendChild(head);
            });
            
            // Draw Ladders
            Object.entries(LADDERS).forEach(([start, end]) => {
                const s = getCoord(parseInt(start));
                const e = getCoord(end);
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', s.x);
                line.setAttribute('y1', s.y);
                line.setAttribute('x2', e.x);
                line.setAttribute('y2', e.y);
                line.setAttribute('stroke', '#22c55e');
                line.setAttribute('stroke-width', '4');
                line.setAttribute('stroke-dasharray', '5,5'); // Ladder rungs look
                line.setAttribute('stroke-linecap', 'square');
                line.style.opacity = '0.6';
                svg.appendChild(line);
                
                const base = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                // Simplifying visual anchors
            });
        }

        function placePieces() {
            // Clear existing pieces
            // Note: We need to locate pieces inside the correct cell div or absolute on board?
            // Existing code appended to cell. We can stick to that, or move to absolute overlay for smooth animation.
            // Let's stick to appending to cell for now, simpler DOM.
            
            boardEl.querySelectorAll('.snl-piece').forEach(p => p.remove());
            positions.forEach((pos, idx) => {
                if (pos > 0) {
                    const cell = boardEl.querySelector(`#snl-cell-${pos}`);
                    if (cell) {
                        const piece = document.createElement('div');
                        piece.className = `snl-piece p${idx + 1}`;
                        
                        // Small offset to not overlap perfectly if on same square
                        if (positions[0] === positions[1] && pos > 0) {
                             if(idx===0) piece.style.transform = 'translate(-40%, -40%)';
                             if(idx===1) piece.style.transform = 'translate(10%, 10%)';
                        }
                        
                        cell.appendChild(piece);
                    }
                }
            });
        }

        function rollDice() {
            if (gameOver) return;
            const roll = Math.floor(Math.random() * 6) + 1;
            const dice = ['⚀','⚁','⚂','⚃','⚄','⚅'];
            diceEl.textContent = dice[roll - 1];
            
            // Animate dice?
            diceEl.style.transform = 'rotate(360deg)';
            setTimeout(() => diceEl.style.transform = 'none', 300);

            self.moveCount++;

            let pos = positions[currentPlayer] + roll;
            let msg = `P${currentPlayer + 1} rolled ${roll}`;

            if (pos > 100) {
                msg += ' (too high)';
            } else {
                if (SNAKES[pos]) { msg += ` 🐍 Snake! ${pos}→${SNAKES[pos]}`; pos = SNAKES[pos]; }
                else if (LADDERS[pos]) { msg += ` 🪜 Ladder! ${pos}→${LADDERS[pos]}`; pos = LADDERS[pos]; }
                positions[currentPlayer] = pos;
            }

            addLog(msg);
            updateCards();
            placePieces(); // Only update pieces, don't full re-render for smooth feeling?
            // Actually, we need to re-render pieces, but not full board. 
            // Refactoring to separate board init from piece update.
            
            if (pos === 100) {
                gameOver = true;
                rollBtn.disabled = true;
                rollBtn.style.display = 'none';
                if (restartBtn) restartBtn.style.display = '';
                const winner = currentPlayer + 1;
                winnerEl.textContent = `🎉 Player ${winner} Wins!`;
                winnerEl.style.display = 'block';
                const duration = Date.now() - (self.sessionStartTime || Date.now());
                eventBus?.emit('game:end', {
                    gameId: 'snakeladders',
                    winner,
                    winReason: `Player ${winner} reached 100!`,
                    moveCount: self.moveCount,
                    sessionDuration: duration,
                    scores: { 1: currentPlayer === 0 ? 1 : 0, 2: currentPlayer === 1 ? 1 : 0 }
                });
                return;
            }

            currentPlayer = currentPlayer === 0 ? 1 : 0;
            updateCards();
        }

        function updateCards() {
            // Emit turn update
            eventBus?.emit("game:turn", { player: currentPlayer === 0 ? 1 : 2 });
        }

        function addLog(msg) {
            logEl.textContent = msg; // Simple single-line log
        }
    }

    getState() { return { currentPlayer: 1, gameActive: true }; }
    makeMove() { return { valid: false }; }
    cleanup() { if (this.boardElement) this.boardElement.innerHTML = ''; }
}