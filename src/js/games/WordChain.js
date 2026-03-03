/**
 * WordChain - Integrated from my_games/word_chain
 * Two players race to complete their word chains
 */
export class WordChain {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.boardElement = null;
        this.sessionStartTime = null;
        this.moveCount = 0;
    }

    async init() {
        this.sessionStartTime = Date.now();
        this.moveCount = 0;
        console.log('WordChain initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) this.boardElement = boardElement;
        if (!this.boardElement) return;

        // Clear previous game if wrapper exists (allows restart)
        const existingWrapper = this.boardElement.querySelector('.wc-wrapper');
        if (existingWrapper) existingWrapper.remove();

        this.boardElement.innerHTML = '';
        this._addStyles();
        this._initEngine();
    }

    _addStyles() {
        if (document.getElementById('wc-styles')) return;
        const style = document.createElement('style');
        style.id = 'wc-styles';
        style.textContent = `
            .wc-wrapper { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; font-family: inherit; max-width: 900px; margin: 0 auto; }
            .wc-header { display: flex; align-items: center; justify-content: space-between; width: 100%; }
            .wc-turn-indicator { font-weight: 700; font-size: 1rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 8px; }
            .wc-btn { padding: 0.5rem 1.5rem; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: 600; cursor: pointer; font-family: inherit; }
            .wc-btn:hover { opacity: 0.9; }
            .wc-players { display: flex; gap: 1rem; width: 100%; }
            .wc-player { flex: 1; border: 2px solid #e2e8f0; border-radius: 12px; padding: 1rem; transition: all 0.3s; }
            .wc-player.dimmed { opacity: 0.5; }
            .wc-player-title { font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; text-align: center; }
            .wc-game-container { display: flex; flex-direction: column; gap: 6px; }
            .word { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
            .word span { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; font-weight: 700; font-size: 0.9rem; background: #f0f0f0; }
            .word input { width: 32px; height: 32px; border: 2px solid #667eea; border-radius: 6px; text-align: center; font-size: 0.9rem; font-weight: 700; font-family: inherit; text-transform: uppercase; }
            .word input:disabled { background: #f0f0f0; border-color: #e2e8f0; }
            .wc-message { font-size: 0.85rem; font-weight: 600; min-height: 1.2rem; text-align: center; color: #667eea; }
            .wc-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
            .wc-modal.hidden { display: none; }
            .wc-modal-inner { background: white; border-radius: 16px; padding: 2rem; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; }
            .wc-modal-title { font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 1rem; }
            .wc-modal-details { font-size: 0.85rem; line-height: 1.8; }
            .wc-controls { display: flex; gap: 1rem; align-items: center; }
        `;
        document.head.appendChild(style);
    }

    _initEngine() {
        const allChains = [
            ["GO", "DOWN", "FALL", "BACK", "STAGE", "NAME", "PLATE", "EDGE"],
            ["HIGH", "GROUND", "LEVEL", "LINE", "END", "DATE", "EVENT", "TIME"],
            ["BLACK", "CAT", "TAIL", "LIGHT", "TRAP", "PLAN", "NOTE", "END"],
            ["WATER", "RISE", "END", "DROP", "POINT", "TEST", "TRACK", "KEY"],
            ["RAIN", "NIGHT", "TIME", "END", "DAY", "YARD", "DOOR", "ROOM"],
            ["FIRE", "ENGINE", "EXIT", "TIME", "END", "DATE", "EVENT", "TICKET"],
            ["FAST", "TRAIN", "NOTE", "END", "DOOR", "ROOM", "MEAL", "LIST"],
            ["STREET", "TREE", "END", "DOOR", "ROAD", "DRIVE", "EVENT", "TIME"],
            ["GREEN", "NET", "TEAM", "MIND", "DREAM", "MAP", "PLACE", "EVENT"],
            ["BOOK", "KEEP", "PAGE", "EDGE", "END", "DATE", "EVENT", "TIME"],
        ];

        function pickTwoChains() {
            const idx1 = Math.floor(Math.random() * allChains.length);
            let idx2;
            do { idx2 = Math.floor(Math.random() * allChains.length); } while (idx2 === idx1);
            return [allChains[idx1], allChains[idx2]];
        }

        const eventBus = this.eventBus;
        const self = this;

        const [chain1, chain2] = pickTwoChains();
        let currentTurn = "P1";

        const wrapper = document.createElement('div');
        wrapper.className = 'wc-wrapper';
        wrapper.innerHTML = `
            <div class="wc-header">
                <div class="wc-turn-indicator" id="wc-turn">Current Turn: P1</div>
                <div class="wc-controls">
                    <button id="wc-check-btn" class="wc-btn">✓ Check Word</button>
                    <button id="wc-new-game" class="wc-btn">New Game</button>
                </div>
            </div>
            <div class="wc-players">
                <div class="wc-player" id="wc-player1">
                    <div class="wc-player-title">🟣 Player 1</div>
                    <div class="wc-game-container" id="wc-chain1"></div>
                    <div class="wc-message" id="wc-msg1"></div>
                </div>
                <div class="wc-player dimmed" id="wc-player2">
                    <div class="wc-player-title">🔵 Player 2</div>
                    <div class="wc-game-container" id="wc-chain2"></div>
                    <div class="wc-message" id="wc-msg2"></div>
                </div>
            </div>
            <div class="wc-modal hidden" id="wc-modal">
                <div class="wc-modal-inner">
                    <div class="wc-modal-title" id="wc-winner-title"></div>
                    <div class="wc-modal-details" id="wc-winner-details"></div>
                    <br>
                    <button id="wc-close-modal" class="wc-btn">Close</button>
                </div>
            </div>
        `;
        this.boardElement.appendChild(wrapper);

        const player1 = { element: wrapper.querySelector('#wc-player1'), index: 1, revealed: 1, chain: chain1 };
        const player2 = { element: wrapper.querySelector('#wc-player2'), index: 1, revealed: 1, chain: chain2 };

        function renderChain(player) {
            const container = player.element.querySelector('.wc-game-container');
            container.innerHTML = '';
            player.chain.forEach((word, idx) => {
                const wordDiv = document.createElement('div');
                wordDiv.classList.add('word');
                if (idx === 0) {
                    word.split('').forEach(letter => {
                        const span = document.createElement('span');
                        span.textContent = letter;
                        wordDiv.appendChild(span);
                    });
                } else if (idx === player.index) {
                    for (let i = 0; i < word.length; i++) {
                        if (i < player.revealed) {
                            const span = document.createElement('span');
                            span.textContent = word[i];
                            wordDiv.appendChild(span);
                        } else {
                            const input = document.createElement('input');
                            input.maxLength = 1;
                            input.addEventListener('input', e => {
                                if (e.target.value) {
                                    const inputs = Array.from(wordDiv.querySelectorAll('input'));
                                    const idx2 = inputs.indexOf(e.target);
                                    if (idx2 < inputs.length - 1) inputs[idx2 + 1].focus();
                                }
                            });
                            input.addEventListener('keydown', e => {
                                if (e.key === 'Enter') { e.preventDefault(); wrapper.querySelector('#wc-check-btn').click(); }
                                else if (e.key === 'Backspace' && !e.target.value) {
                                    const inputs = Array.from(wordDiv.querySelectorAll('input'));
                                    const idx2 = inputs.indexOf(e.target);
                                    if (idx2 > 0) inputs[idx2 - 1].focus();
                                }
                            });
                            wordDiv.appendChild(input);
                        }
                    }
                } else if (idx < player.index) {
                    word.split('').forEach(letter => {
                        const span = document.createElement('span');
                        span.textContent = letter;
                        span.style.background = '#a3f6a3';
                        wordDiv.appendChild(span);
                    });
                } else {
                    const span = document.createElement('span');
                    span.textContent = word[0];
                    wordDiv.appendChild(span);
                    for (let i = 1; i < word.length; i++) {
                        const input = document.createElement('input');
                        input.disabled = true;
                        wordDiv.appendChild(input);
                    }
                }
                container.appendChild(wordDiv);
            });
            const firstEmpty = container.querySelector('input:not([disabled])');
            if (firstEmpty) firstEmpty.focus();
        }

        function checkWord(player) {
            const currentWord = player.chain[player.index];
            const wordDiv = player.element.querySelector('.wc-game-container').children[player.index];
            const inputs = wordDiv.querySelectorAll('input');
            let guessed = currentWord.substring(0, player.revealed);
            inputs.forEach(inp => guessed += inp.value.toUpperCase() || '_');

            const msgEl = player === player1 ? wrapper.querySelector('#wc-msg1') : wrapper.querySelector('#wc-msg2');

            if (guessed === currentWord) {
                msgEl.textContent = '✅ Correct!';
                player.index++;
                player.revealed = 1;
                self.moveCount++;
                if (player.index >= player.chain.length) {
                    showWinnerModal();
                    return;
                }
                renderChain(player);
            } else {
                msgEl.textContent = '❌ Wrong! Passing turn...';
                if (player.revealed < currentWord.length) player.revealed++;
                switchTurn();
            }
        }

        function switchTurn() {
            currentTurn = currentTurn === 'P1' ? 'P2' : 'P1';
            const p1El = wrapper.querySelector('#wc-player1');
            const p2El = wrapper.querySelector('#wc-player2');
            if (currentTurn === 'P1') {
                p1El.classList.remove('dimmed');
                p2El.classList.add('dimmed');
                renderChain(player1);
            } else {
                p2El.classList.remove('dimmed');
                p1El.classList.add('dimmed');
                renderChain(player2);
            }
            wrapper.querySelector('#wc-turn').textContent = `Current Turn: ${currentTurn}`;
        }

        function showWinnerModal() {
            const winnerTitle = `${currentTurn} Wins! 🎉`;
            wrapper.querySelector('#wc-winner-title').textContent = winnerTitle;
            wrapper.querySelector('#wc-modal').classList.remove('hidden');
            wrapper.querySelector('#wc-check-btn').disabled = true;

            const winner = currentTurn === 'P1' ? 1 : 2;
            const duration = Date.now() - (self.sessionStartTime || Date.now());
            eventBus?.emit('game:end', {
                gameId: 'wordchain',
                winner,
                winReason: winnerTitle,
                moveCount: self.moveCount,
                sessionDuration: duration,
                scores: { 1: player1.index, 2: player2.index }
            });
        }

        wrapper.querySelector('#wc-check-btn').addEventListener('click', () => {
            if (currentTurn === 'P1') checkWord(player1);
            else checkWord(player2);
        });

        wrapper.querySelector('#wc-close-modal').addEventListener('click', () => {
            wrapper.querySelector('#wc-modal').classList.add('hidden');
        });

        wrapper.querySelector('#wc-new-game').addEventListener('click', () => {
            this.render(null, this.boardElement);
        });

        renderChain(player1);
        renderChain(player2);
        switchTurn();
    }

    getState() { return { currentPlayer: 1, gameActive: true }; }
    makeMove() { return { valid: false }; }
    cleanup() { if (this.boardElement) this.boardElement.innerHTML = ''; }
}
