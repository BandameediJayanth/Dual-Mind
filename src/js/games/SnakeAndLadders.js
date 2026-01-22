const player1 = document.getElementById("player1");
const player2 = document.getElementById("player2");
const rollBtn = document.getElementById("roll-btn");
const diceImg = document.getElementById("dice");
const turnInfo = document.getElementById("turn-info");
const popup = document.getElementById("popup");
const winnerMsg = document.getElementById("winner-msg");
const resetBtn = document.getElementById("reset-btn");

let positions = [1, 1];
let turn = 0;

const snakes = {
    98: 78,
    96: 47,
    94: 73,
    63: 59,
    64: 37,
    42: 22,
    70: 49,
    33: 27,
    25: 4,
    29: 10,
};

const ladders = {
    2:23 ,
    8:14 ,
    26:35 ,
    31:86 ,
    38:44 ,
    41:60 ,
    56:77 ,
    69:90,
    79:81,
    88:92 
};

function movePlayer(player, pos, animate = true) {
    const size = 50; // 500px board / 10 cells
    let row = Math.floor((pos - 1) / 10);
    let col = (pos - 1) % 10;
    if (row % 2 === 1) col = 9 - col;
    
    if (animate) {
        player.classList.add('moving');
        setTimeout(() => {
            player.classList.remove('moving');
        }, 500);
    }
    
    // Check if both players are on the same cell
    const player1Pos = positions[0];
    const player2Pos = positions[1];
    const sameCell = player1Pos === player2Pos;
    
    let offsetX = 0;
    let offsetY = 0;
    
    if (sameCell && pos === player1Pos) {
        // If players are on the same cell, add offset
        if (player === player1) {
            offsetX = -8; // Player 1 slightly left
            offsetY = -8; // Player 1 slightly up
        } else {
            offsetX = 8;  // Player 2 slightly right
            offsetY = 8;  // Player 2 slightly down
        }
    }
    
    // Center the piece in the cell (15px offset to center 30px piece in 50px cell)
    player.style.left = (col * size + 10 + offsetX) + "px";
    player.style.top = ((9 - row) * size + 10 + offsetY) + "px";
}

function animateDiceRoll(finalValue, callback) {
    rollBtn.disabled = true;
    diceImg.classList.add('rolling');
    
    let rolls = 0;
    const maxRolls = 10;
    const interval = setInterval(() => {
        const randomRoll = Math.floor(Math.random() * 6) + 1;
        diceImg.className = `face-${randomRoll} rolling`;
        
        rolls++;
        if (rolls >= maxRolls) {
            clearInterval(interval);
            diceImg.classList.remove('rolling');
            diceImg.className = `face-${finalValue}`;
            rollBtn.disabled = false;
            callback();
        }
    }, 100);
}

function rollDice() {
    const roll = Math.floor(Math.random() * 6) + 1;
    
    animateDiceRoll(roll, () => {
        let newPos = positions[turn] + roll;
        if (newPos > 100) newPos = positions[turn];
        
        // Move to new position with animation
        let finalPos = newPos;
        positions[turn] = newPos;
        
        setTimeout(() => {
            // Check for snakes
            if (snakes[newPos]) {
                finalPos = snakes[newPos];
                turnInfo.textContent = `Oops! Snake at ${newPos}!`;
                setTimeout(() => {
                    positions[turn] = finalPos;
                    movePlayer(turn === 0 ? player1 : player2, finalPos);
                }, 500);
            }
            
            // Check for ladders
            if (ladders[newPos]) {
                finalPos = ladders[newPos];
                turnInfo.textContent = `Yay! Ladder at ${newPos}!`;
                setTimeout(() => {
                    positions[turn] = finalPos;
                    movePlayer(turn === 0 ? player1 : player2, finalPos);
                }, 500);
            }
            
            movePlayer(turn === 0 ? player1 : player2, newPos);
            
            setTimeout(() => {
                if (finalPos === 100) {
                    winnerMsg.textContent = `Player ${turn + 1} Wins! 🎉`;
                    popup.style.display = "flex";
                    rollBtn.disabled = true;
                    return;
                }
                
                if (roll !== 6) { // Only change turns if not a 6
                    turn = 1 - turn;
                    turnInfo.textContent = `Player ${turn + 1}'s Turn`;
                } else {
                    turnInfo.textContent = `Player ${turn + 1} got a 6! Roll again!`;
                }
            }, 1000);
        }, 500);
    });
}


rollBtn.addEventListener("click", rollDice);

// Reset button in popup
resetBtn.addEventListener("click", () => {
    positions = [1, 1];
    turn = 0;
    popup.style.display = "none";
    turnInfo.textContent = "Player 1's Turn";
    movePlayer(player1, 1);
    movePlayer(player2, 1);
    rollBtn.disabled = false;
});

// Reset game button
const resetGameBtn = document.getElementById("reset-game-btn");
resetGameBtn.addEventListener("click", () => {
    positions = [1, 1];
    turn = 0;
    popup.style.display = "none";
    turnInfo.textContent = "Player 1's Turn";
    movePlayer(player1, 1);
    movePlayer(player2, 1);
    rollBtn.disabled = false;
});

movePlayer(player1, 1);
movePlayer(player2, 1);
    