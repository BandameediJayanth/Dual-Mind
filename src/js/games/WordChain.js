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
  ["LONG", "GAME", "END", "DAY", "YEAR", "ROAD", "DOOR", "ROOM"],
  ["AIR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END"],
  ["COLD", "DAY", "YEAR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST"],
  ["SMALL", "LAKE", "END", "DOOR", "ROAD", "DRIVE", "EVENT", "TIME"],
  ["BIG", "GAME", "END", "DATE", "EVENT", "TIME", "END", "DOOR"],
  ["WHITE", "EAR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST", "TIME"],
  ["DEEP", "POOL", "LIGHT", "TRAP", "PLAN", "NOTE", "END", "DAY"],
  ["STRONG", "GAME", "END", "DAY", "YEAR", "ROAD", "DOOR", "ROOM"],
  ["DARK", "KEY", "YARD", "DOOR", "ROAD", "DRIVE", "EVENT", "TIME"],
  ["QUICK", "KIT", "TIME", "END", "DATE", "EVENT", "TIME", "END"],
  ["SCHOOL", "LAB", "BOOK", "KEEP", "PAGE", "EDGE", "END", "DATE"],
  ["ROAD", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END", "DAY"],
  ["HAND", "DOOR", "ROAD", "DRIVE", "EVENT", "TIME", "END", "DATE"],
  ["PARK", "KEEP", "PAGE", "EDGE", "END", "DATE", "EVENT", "TIME"],
  ["GAME", "END", "DATE", "EVENT", "TIME", "END", "DAY", "YEAR"],
  ["STONE", "EDGE", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["SNOW", "WALL", "LIGHT", "TRAP", "PLAN", "NOTE", "END", "DATE"],
  ["MOON", "NET", "TEAM", "MIND", "DREAM", "MAP", "PLACE", "EVENT"],
  ["ROAD", "DRIVE", "EVENT", "TIME", "END", "DATE", "EVENT", "TICKET"],
  ["TABLE", "EDGE", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["LIGHT", "TRAP", "PLAN", "NOTE", "END", "DATE", "EVENT", "TIME"],
  ["DEEP", "POOL", "LIGHT", "TRAP", "PLAN", "NOTE", "END", "DATE"],
  ["BLUE", "EYE", "EAR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST"],
  ["BLACK", "KEY", "YARD", "DOOR", "ROOM", "MEAL", "LIST", "TIME"],
  ["CITY", "YARD", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END"],
  ["HOUSE", "EDGE", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["LARGE", "EAR", "ROAD", "DRIVE", "EVENT", "TIME", "END", "DATE"],
  ["RED", "DOOR", "ROAD", "DRIVE", "EVENT", "TIME", "END", "DATE"],
  ["SMALL", "LAKE", "EDGE", "END", "DATE", "EVENT", "TIME", "END"],
  ["CLEAR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END"],
  ["NIGHT", "TIME", "END", "DAY", "YEAR", "ROAD", "DOOR", "ROOM"],
  ["DAY", "YEAR", "ROAD", "DRIVE", "EVENT", "TIME", "END", "DATE"],
  ["YEAR", "ROAD", "DRIVE", "EVENT", "TIME", "END", "DAY", "YEAR"],
  ["TREE", "EAR", "ROAD", "DRIVE", "EVENT", "TIME", "END", "DATE"],
  ["SNOW", "WALL", "LIGHT", "TRAP", "PLAN", "NOTE", "END", "DATE"],
  ["RIVER", "ROAD", "DRIVE", "EVENT", "TIME", "END", "DAY", "YEAR"],
  ["MAP", "PLACE", "EDGE", "END", "DATE", "EVENT", "TIME", "END"],
  ["COAL", "LAND", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END"],
  ["TRAIN", "NOTE", "END", "DAY", "YEAR", "ROAD", "DOOR", "ROOM"],
  ["WIND", "DOOR", "ROAD", "DRIVE", "EVENT", "TIME", "END", "DATE"],
  ["RAIN", "NET", "TEAM", "MAP", "PLACE", "EDGE", "END", "DATE"],
  ["LEAF", "FALL", "BACK", "COURT", "TIME", "END", "DATE", "EVENT"],
  ["ROAD", "DRIVE", "EVENT", "TIME", "END", "DATE", "EVENT", "PLACE"],
  ["DESK", "KEY", "YARD", "DOOR", "ROOM", "MEAL", "LIST", "TIME"],
  ["CAT", "TAIL", "LIGHT", "TRAP", "PLAN", "NOTE", "END", "DATE"],
  ["DOG", "GATE", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["STONE", "EDGE", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["BALL", "LAND", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END"],
  ["ROOM", "MEAL", "LIST", "TIME", "END", "DATE", "EVENT", "TICKET"],
  ["FIRE", "EXIT", "TIME", "END", "DATE", "EVENT", "TIME", "END"],
  ["SCHOOL", "LAB", "BOOK", "KEEP", "PAGE", "EDGE", "END", "DATE"],
  ["COLD", "DAY", "YEAR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST"],
  ["GOLD", "DUST", "TREE", "EAR", "ROAD", "DOOR", "ROOM", "MEAL"],
  ["SILVER", "RING", "GOLD", "DUST", "TREE", "EAR", "ROAD", "DOOR"],
  ["SNOW", "WALL", "LIGHT", "TRAP", "PLAN", "NOTE", "END", "DATE"],
  ["LAKE", "EDGE", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["FAST", "TRAIN", "NOTE", "END", "DAY", "YEAR", "ROAD", "DRIVE"],
  ["LONG", "GAME", "END", "DAY", "YEAR", "ROAD", "DRIVE", "EVENT"],
  ["NIGHT", "TIME", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["RED", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END", "DAY"],
  ["TREE", "EAR", "ROAD", "DRIVE", "EVENT", "TIME", "END", "DATE"],
  ["GAME", "END", "DATE", "EVENT", "TIME", "END", "DAY", "YEAR"],
  ["STAGE", "EDGE", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["HOUSE", "EDGE", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["RAIN", "NET", "TEAM", "MAP", "PLACE", "EDGE", "END", "DATE"],
  ["LEAF", "FALL", "BACK", "COURT", "TIME", "END", "DATE", "EVENT"],
  ["ROAD", "DRIVE", "EVENT", "TIME", "END", "DATE", "EVENT", "PLACE"],
  ["DESK", "KEY", "YARD", "DOOR", "ROOM", "MEAL", "LIST", "TIME"],
  ["CAT", "TAIL", "LIGHT", "TRAP", "PLAN", "NOTE", "END", "DATE"],
  ["DOG", "GATE", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["STONE", "EDGE", "END", "DATE", "EVENT", "TIME", "END", "DAY"],
  ["BALL", "LAND", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END"],
  ["ROOM", "MEAL", "LIST", "TIME", "END", "DATE", "EVENT", "TICKET"],
  ["FIRE", "EXIT", "TIME", "END", "DATE", "EVENT", "TIME", "END"],
  ["CITY", "YARD", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END"],
  ["WHITE", "EAR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST", "TIME"],
  ["DARK", "KEY", "YARD", "DOOR", "ROAD", "DRIVE", "EVENT", "TIME"],
  ["SILVER", "RING", "GOLD", "DUST", "TREE", "EAR", "ROAD", "DOOR"],
  ["GOLD", "DUST", "TREE", "EAR", "ROAD", "DOOR", "ROOM", "MEAL"],
  ["FAST", "TRAIN", "NOTE", "END", "DOOR", "ROOM", "MEAL", "LIST"],
  ["GREEN", "NET", "TEAM", "MIND", "DREAM", "MAP", "PLACE", "EVENT"],
  ["BLUE", "EYE", "EAR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST"],
  ["MOON", "NET", "TEAM", "MIND", "DREAM", "MAP", "PLACE", "EVENT"],
  ["PARK", "KEEP", "PAGE", "EDGE", "END", "DATE", "EVENT", "TIME"],
  ["CLEAR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END"],
  ["QUICK", "KIT", "TIME", "END", "DATE", "EVENT", "TIME", "END"],
  ["BLACK", "CAT", "TAIL", "LIGHT", "TRAP", "PLAN", "NOTE", "END"],
  ["WATER", "RISE", "END", "DROP", "POINT", "TEST", "TRACK", "KEY"],
  ["RAIN", "NIGHT", "TIME", "END", "DAY", "YARD", "DOOR", "ROOM"],
  ["FIRE", "ENGINE", "EXIT", "TIME", "END", "DATE", "EVENT", "TICKET"],
  ["FAST", "TRAIN", "NOTE", "END", "DOOR", "ROOM", "MEAL", "LIST"],
  ["STREET", "TREE", "END", "DOOR", "ROAD", "DRIVE", "EVENT", "TIME"],
  ["GREEN", "NET", "TEAM", "MIND", "DREAM", "MAP", "PLACE", "EVENT"],
  ["BOOK", "KEEP", "PAGE", "EDGE", "END", "DATE", "EVENT", "TIME"],
  ["LONG", "GAME", "END", "DAY", "YEAR", "ROAD", "DOOR", "ROOM"],
  ["AIR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST", "TIME", "END"],
  ["COLD", "DAY", "YEAR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST"],
  ["SMALL", "LAKE", "END", "DOOR", "ROAD", "DRIVE", "EVENT", "TIME"],
  ["BIG", "GAME", "END", "DATE", "EVENT", "TIME", "END", "DOOR"],
  ["WHITE", "EAR", "ROAD", "DOOR", "ROOM", "MEAL", "LIST", "TIME"],
  ["DEEP", "POOL", "LIGHT", "TRAP", "PLAN", "NOTE", "END", "DAY"],
  ["STRONG", "GAME", "END", "DAY", "YEAR", "ROAD", "DOOR", "ROOM"],
  ["DARK", "KEY", "YARD", "DOOR", "ROAD", "DRIVE", "EVENT", "TIME"],
  ["QUICK", "KIT", "TIME", "END", "DATE", "EVENT", "TIME", "END"]
];

// Pick two random, different chains
function pickTwoChains() {
  const idx1 = Math.floor(Math.random() * allChains.length);
  let idx2;
  do {
    idx2 = Math.floor(Math.random() * allChains.length);
  } while (idx2 === idx1);
  return [allChains[idx1], allChains[idx2]];
}

const [chain1, chain2] = pickTwoChains();

let currentTurn = "P1";

const player1 = { element: document.getElementById("player1"), index: 1, revealed: 1, completed: [], chain: chain1 };
const player2 = { element: document.getElementById("player2"), index: 1, revealed: 1, completed: [], chain: chain2 };

function renderChain(player) {
  const container = player.element.querySelector(".game-container");
  container.innerHTML = "";

  player.chain.forEach((word, idx) => {
    const wordDiv = document.createElement("div");
    wordDiv.classList.add("word");

    if (idx === 0) {
      word.split("").forEach(letter => {
        const span = document.createElement("span");
        span.textContent = letter;
        wordDiv.appendChild(span);
      });
    } 
    else if (idx === player.index) {
      for (let i = 0; i < word.length; i++) {
        if (i < player.revealed) {
          const span = document.createElement("span");
          span.textContent = word[i];
          wordDiv.appendChild(span);
        } else {
          const input = document.createElement("input");
          input.maxLength = 1;
          input.addEventListener("input", e => moveToNext(e, player));
          input.addEventListener("keydown", e => handleKey(e, player));
          wordDiv.appendChild(input);
        }
      }
    } 
    else if (idx < player.index) {
      word.split("").forEach(letter => {
        const span = document.createElement("span");
        span.textContent = letter;
        wordDiv.appendChild(span);
      });
    } 
    else {
      const span = document.createElement("span");
      span.textContent = word[0];
      wordDiv.appendChild(span);
      for (let i = 1; i < word.length; i++) {
        const input = document.createElement("input");
        input.disabled = true;
        wordDiv.appendChild(input);
      }
    }
    container.appendChild(wordDiv);
  });

  focusFirstEmpty(player);
}

function moveToNext(e, player) {
  const inputs = Array.from(player.element.querySelector(".game-container").children[player.index].querySelectorAll("input"));
  const idx = inputs.indexOf(e.target);
  if (e.target.value && idx < inputs.length - 1) {
    inputs[idx + 1].focus();
  }
}

function handleKey(e, player) {
  const inputs = Array.from(player.element.querySelector(".game-container").children[player.index].querySelectorAll("input"));
  const idx = inputs.indexOf(e.target);

  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("check-btn").click();
  } 
  else if (e.key === "Backspace") {
    if (!e.target.value && idx > 0) {
      inputs[idx - 1].focus();
    }
  }
}

function focusFirstEmpty(player) {
  const firstEmpty = player.element.querySelector(".game-container .word:nth-child(" + (player.index + 1) + ") input");
  if (firstEmpty) firstEmpty.focus();
}

function checkWord(player) {
  const currentWord = player.chain[player.index];
  const wordDiv = player.element.querySelector(".game-container").children[player.index];
  const inputs = wordDiv.querySelectorAll("input");
  let guessedWord = currentWord.substring(0, player.revealed);

  inputs.forEach(inp => guessedWord += inp.value.toUpperCase() || "_");

  if (guessedWord === currentWord) {
    player.completed.push(currentWord);
    player.element.querySelector(".message").textContent = "✅ Correct!";
    player.index++;
    player.revealed = 1;

    if (player.index >= player.chain.length) {
      showWinnerModal();
      document.getElementById("check-btn").disabled = true;
      return;
    }
    renderChain(player);
  } else {
    player.element.querySelector(".message").textContent = "❌ Wrong! Passing turn...";
    if (player.revealed < currentWord.length) {
      player.revealed++;
    }
    switchTurn();
  }
}

function switchTurn() {
  currentTurn = currentTurn === "P1" ? "P2" : "P1";

  if (currentTurn === "P1") {
    player1.element.classList.remove("dimmed");
    player2.element.classList.add("dimmed");
    renderChain(player1);
  } else {
    player2.element.classList.remove("dimmed");
    player1.element.classList.add("dimmed");
    renderChain(player2);
  }

  document.getElementById("turn-indicator").textContent = `Current Turn: ${currentTurn}`;
}

function showWinnerModal() {
  const winnerTitle = `${currentTurn} Wins! 🎉`;
  document.getElementById("winner-title").innerHTML = winnerTitle;

  function renderPlayerChain(player) {
    return player.chain.map((word, idx) => {
      let wordHtml = '';
      // For completed words, all letters are dark
      // For current word, only revealed letters are dark
      // For future words, only the first letter is dark, rest are dim
      if (idx < player.index) {
        // Completed word
        for (let i = 0; i < word.length; i++) {
          wordHtml += `<span style="background:#a3f6a3; color:#222; padding:3px 6px; margin:2px; border-radius:4px; font-weight:bold;">${word[i]}</span>`;
        }
      } else if (idx === player.index) {
        // Current word: revealed letters dark, rest dim
        for (let i = 0; i < word.length; i++) {
          if (i < player.revealed) {
            wordHtml += `<span style="background:#a3f6a3; color:#222; padding:3px 6px; margin:2px; border-radius:4px; font-weight:bold;">${word[i]}</span>`;
          } else {
            wordHtml += `<span style="background:#eee; color:#bbb; padding:3px 6px; margin:2px; border-radius:4px;">${word[i]}</span>`;
          }
        }
      } else {
        // Future word: only first letter dark, rest dim
        for (let i = 0; i < word.length; i++) {
          if (i === 0) {
            wordHtml += `<span style="background:#a3f6a3; color:#222; padding:3px 6px; margin:2px; border-radius:4px; font-weight:bold;">${word[i]}</span>`;
          } else {
            wordHtml += `<span style="background:#eee; color:#bbb; padding:3px 6px; margin:2px; border-radius:4px;">${word[i]}</span>`;
          }
        }
      }
      return `<div style="margin-bottom:5px;">${wordHtml}</div>`;
    }).join('');
  }

  const details = `<strong>P1:</strong><br>${renderPlayerChain(player1)}<br><strong>P2:</strong><br>${renderPlayerChain(player2)}`;
  document.getElementById("winner-details").innerHTML = details;

  document.getElementById("winner-modal").style.display = "block";
}

// Modal close logic
document.getElementById("close-modal").onclick = function() {
    document.getElementById("winner-modal").style.display = "none";
};
window.onclick = function(event) {
    if (event.target == document.getElementById("winner-modal")) {
        document.getElementById("winner-modal").style.display = "none";
    }
};

document.getElementById("check-btn").addEventListener("click", () => {
  if (currentTurn === "P1") {
    checkWord(player1);
  } else {
    checkWord(player2);
  }
});

renderChain(player1);
renderChain(player2);
switchTurn(); // initialize dimmed state and focus
