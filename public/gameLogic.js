/// vars
let ctx = document.querySelector("canvas").getContext("2d");
let winW = window.innerWidth;
let winH = (window.innerHeight
    - 43 //document.querySelector("h1#message").offsetHeight
    - 50 //document.querySelector("button#playAgain").offsetHeight
    - 50);
let cellDim = min(winH/ROWS, winW/COLS);
let width = (ctx.canvas.width = cellDim * COLS);
let height = (ctx.canvas.height = cellDim * ROWS);
ctx.canvas.style.height = `${height}px`;
ctx.canvas.style.width = `${width}px`;

/// init board
function getCursorPosition(event) {
    const rect = ctx.canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    return { x, y };
}
function handleClick(event) {
    const { x, y } = getCursorPosition(event);
    const r = Math.floor(y / cellDim);
    const c = Math.floor(x / cellDim);
    if(mySymbol != game.turn){ return; }
    if (game.board[r][c] != '.') { return; }
    if (r < ROWS - 1) {
        if (game.board[r + 1][c] == '.') { return; }
    }
    ws.send(JSON.stringify({
        type: "move",
        data: {r, c}
    }));
}
ctx.canvas.addEventListener("click", handleClick);

/// drawing functions
function clearCanvas() {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);
}
function drawAtCoords(r, c, symbol) {
    let x = c * cellDim;
    let y = r * cellDim;
    if (symbol == 'X') {
        let drawDim = cellDim * X_SCALE;
        let drawDimGap = cellDim * (1 - X_SCALE);

        ctx.strokeStyle = X_COLOR;
        ctx.lineWidth = SYMBOL_WIDTH;
        ctx.beginPath();
        ctx.moveTo(x + drawDimGap, y + drawDimGap);
        ctx.lineTo(x + drawDim, y + drawDim);
        ctx.moveTo(x + drawDim, y + drawDimGap);
        ctx.lineTo(x + drawDimGap, y + drawDim);
        ctx.stroke();
    } else if (symbol == 'O') {
        ctx.strokeStyle = O_COLOR;
        ctx.lineWidth = SYMBOL_WIDTH;
        let r = (cellDim * O_SCALE) / 2;
        ctx.beginPath();
        ctx.arc(x + cellDim / 2, y + cellDim / 2, r, 0, 2 * Math.PI);
        ctx.stroke();
    }else if(symbol == 'H'){ // highlight {
        let sym = game.board[r][c];
        ctx.fillStyle = (sym=='X'?X_HIGHLIGHT_COLOR:O_HIGHLIGHT_COLOR);
        ctx.fillRect(x, y, cellDim, cellDim);
    }
}
function drawBoard() {
    clearCanvas();
    if(game.lastMove != null){
        drawAtCoords(game.lastMove.r, game.lastMove.c, 'H');
    }
    ctx.strokeStyle = "grey";
    ctx.lineCap = "round";
    ctx.lineWidth = 1;
    for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellDim);
        ctx.lineTo(width, r * cellDim);
        ctx.stroke();
    }
    for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellDim, 0);
        ctx.lineTo(c * cellDim, height);
        ctx.stroke();
    }
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawAtCoords(r, c, game.board[r][c]);
        }
    }
    if (game.win != null && game.win != 'T') {
        ctx.strokeStyle = (game.win == 'X' ? X_WINSTROKE_COLOR : O_WINSTROKE_COLOR);
        ctx.lineWidth = WINSTROKE_WIDTH;
        game.winPaths.forEach(w => {
            ctx.beginPath();
            ctx.moveTo(w.path[0].c * cellDim + cellDim/2, w.path[0].r * cellDim + cellDim/2);
            ctx.lineTo(w.path[1].c * cellDim + cellDim/2, w.path[1].r * cellDim + cellDim/2);
            ctx.lineTo(w.path[2].c * cellDim + cellDim/2, w.path[2].r * cellDim + cellDim/2);
            ctx.stroke();
        });
    }
}