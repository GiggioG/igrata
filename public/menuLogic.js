let ws = new WebSocket(`${location.protocol == "https:"?"wss":"ws"}://${location.host}`);
let mySymbol = null;
let gameId = null;

let game = {
    board: [],
    turn: null,
    lastMove: null,
    win: null,
    winPaths: []
}
let hasWin = false;
for (let i = 0; i < ROWS; i++) {
    game.board.push(".".repeat(COLS).split(""));
}

const turnSpan = document.querySelector("span#turn");
const messageH = document.querySelector("h1#message");
const winMessageH = document.querySelector("h1#winMessage");
const gameIdP = document.querySelector("p#gameId");

function updateTurn(sym){
    turnSpan.innerHTML = sym;
    turnSpan.style.color = (sym=='X'?X_COLOR:O_COLOR);
}

function deserialiseGameData(gameData){
    if(hasWin){
        game.win = null;
        game.winPaths = [];
        game.lastMove = null;
        messageH.style.display = "";
        winMessageH.style.display = "none";
        document.querySelector("button#playAgain").style.filter = "opacity(0)";
        document.querySelector("button#playAgain").disabled = game.turn;
        hasWin = false;
    }

    let [boardSquished, turn, lastMoveSquished] = gameData.split("|");

    for(let r = 0; r < ROWS; r++){
        for(let c = 0; c < COLS; c++){
            game.board[r][c] = boardSquished[r*COLS + c];
        }
    }

    game.turn = turn;
    updateTurn(turn);
    
    if(lastMoveSquished != "null"){
        game.lastMove = {r: null, c: null};
        ([game.lastMove.r, game.lastMove.c] = lastMoveSquished.split(',').map(Number));
    }

    drawBoard();
}

function playAgain(){
    ws.send(JSON.stringify({
        type: "reset",
        data: null
    }));
}


function parseWSMessage(msg){
    console.log(msg);
    if(msg.type == "join_game"){
        document.querySelector("div#form").style.display = "none";
        document.querySelector("main").style.display = "";
        ({symbol: mySymbol, gameId} = msg.data);
        gameIdP.innerHTML = `Game Code:<br><b>${gameId}<b>`;
        document.querySelector("button#playAgain").style.color = (mySymbol=='X'?X_COLOR:O_COLOR);
        deserialiseGameData(msg.data.gameData);
    }else if(msg.type == "game_update"){
        deserialiseGameData(msg.data);
    }else if(msg.type == "game_end"){
        hasWin = true;
        game.win = msg.data.win;
        game.winPaths = msg.data.winPaths;
        drawBoard();

        winMessageH.innerHTML = `${game.win} WON!!!`;
        winMessageH.style.color = (game.win=='X'?X_COLOR:O_COLOR);
        messageH.style.display = "none";
        winMessageH.style.display = "";
        document.querySelector("button#playAgain").style.filter = "";
        document.querySelector("button#playAgain").disabled = false;
    }else if(msg.type == "error"){
        alert(`Error: ${msg.data}`);
    }
}

ws.addEventListener("message", message => {
    parseWSMessage(JSON.parse(message.data));
});

document.querySelector("button#createGame").addEventListener("click", ()=>{
    let symbol = document.querySelector("select#preferedSymbol").value;
    ws.send(JSON.stringify({
        type: "create_game",
        data: {
            symbol
        }
    }));
});

document.querySelector("button#joinGame").addEventListener("click", ()=>{
    let gameId = document.querySelector("input#gameCode").value;
    ws.send(JSON.stringify({
        type: "join_game",
        data: {
            gameId
        }
    }));
});