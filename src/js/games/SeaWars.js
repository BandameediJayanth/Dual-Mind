const GRID_SIZE = 10;
const SHIP_SIZES = [4, 3, 3, 2, 2, 1]; // ship lengths

let player1Board = [];
let player2Board = [];
let currentPlayer = 1;
let placingShips = true;
let currentShipIndex = 0;
let gameOver = false;

const player1Grid = document.getElementById('player1-grid');
const player2Grid = document.getElementById('player2-grid');
const info = document.getElementById('info');
const restartBtn = document.getElementById('restart-btn');

function createBoard(playerGrid, boardArray, playerNum) {
    playerGrid.innerHTML = '';
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        let cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(playerNum, i));
        boardArray.push({ ship: false, hit: false });
        playerGrid.appendChild(cell);
    }
}

function handleCellClick(playerNum, index) {
    if (gameOver) return;

    if (placingShips) {
        if (playerNum !== currentPlayer) return;
        placeShip(index);
    } else {
        if (playerNum === currentPlayer) return; // Can't click own board
        attackCell(playerNum, index);
    }
}

function placeShip(index) {
    let board = currentPlayer === 1 ? player1Board : player2Board;
    let grid = currentPlayer === 1 ? player1Grid : player2Grid;
    let size = SHIP_SIZES[currentShipIndex];

    let row = Math.floor(index / GRID_SIZE);
    let col = index % GRID_SIZE;

    // Simple horizontal placement
    if (col + size > GRID_SIZE) {
        info.textContent = "Not enough space here!";
        return;
    }
    // Check overlap
    for (let i = 0; i < size; i++) {
        if (board[row * GRID_SIZE + col + i].ship) {
            info.textContent = "Ships cannot overlap!";
            return;
        }
    }
    // Place ship
    for (let i = 0; i < size; i++) {
        board[row * GRID_SIZE + col + i].ship = true;
        grid.children[row * GRID_SIZE + col + i].classList.add('ship');
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
            info.textContent = "All ships placed! Player 1 starts!";
        }
    } else {
        info.textContent = `Place ship of size ${SHIP_SIZES[currentShipIndex]}`;
    }
}

function attackCell(playerNum, index) {
    let board = playerNum === 1 ? player1Board : player2Board;
    let grid = playerNum === 1 ? player1Grid : player2Grid;

    if (board[index].hit) {
        info.textContent = "Already attacked here!";
        return;
    }
    board[index].hit = true;

    if (board[index].ship) {
        grid.children[index].classList.add('hit');
        info.textContent = `Hit! Player ${currentPlayer} goes again.`;
        if (checkWin(board)) {
            info.textContent = `Player ${currentPlayer} wins!`;
            gameOver = true;
            restartBtn.style.display = 'block';
        }
    } else {
        grid.children[index].classList.add('miss');
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        info.textContent = `Miss! Player ${currentPlayer}'s turn.`;
    }
}

function checkWin(board) {
    return board.every(cell => !cell.ship || cell.hit);
}

restartBtn.addEventListener('click', startGame);

function startGame() {
    player1Board = [];
    player2Board = [];
    gameOver = false;
    placingShips = true;
    currentShipIndex = 0;
    currentPlayer = 1;
    createBoard(player1Grid, player1Board, 1);
    createBoard(player2Grid, player2Board, 2);
    info.textContent = "Player 1: Place your ships!";
    restartBtn.style.display = 'none';
}

startGame();
