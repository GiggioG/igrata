const {invertSymbol} = require("./lib_util.js");

const ROWS = 5;
const COLS = 8;

class Game{
    constructor(turn){
        this.state = "in_progress";
        this.board = [];
        for (let i = 0; i < ROWS; i++) {
            this.board.push(".".repeat(COLS).split(""));
        }
        this.turn = turn;
        this.lastMove = null;
    }
    serialise(){
        let board = this.board.flatMap(e=>e).join('');
        return `${board}|${this.turn}|${this.lastMove}`;
    }
    swtichTurn(){
        this.turn = invertSymbol(this.turn);
    }
    move(r, c){
        if(r < 0 || r >= ROWS || c < 0 || c >= COLS){ return false; }
        if (this.board[r][c] != '.') { return false; }
        if ((r < ROWS - 1) && (this.board[r + 1][c] == '.')) { return false; }
        this.board[r][c] = this.turn;
        this.swtichTurn();
        this.lastMove = `${r},${c}`;
        return true;
    }
    checkWin() {
        let win = null;
        let winPaths = [];
        for (let r = ROWS - 1; r >= 0; r--) {
            for (let c = 0; c < COLS - 2; c++) {
                let sym = this.board[r][c];
                if (sym != 'X' && sym != 'O') { continue; }
                if (this.board[r][c + 2] == sym) {
                    if (r > 0 && this.board[r - 1][c + 1] == sym) {
                        win = sym;
                        winPaths.push({type: '^', path: [
                            { r: r, c: c },
                            { r: r - 1, c: c + 1 },
                            { r: r, c: c + 2 }
                        ]});
                    }
                    if (r < ROWS - 1 && this.board[r + 1][c + 1] == sym) {
                        win = sym;
                        winPaths.push({type: 'v', path: [
                            { r: r, c: c },
                            { r: r + 1, c: c + 1 },
                            { r: r, c: c + 2 }
                        ]});
                    }
                }
            }
        }
        if(win != null){
            this.state = "ended";
        }
        return {win, winPaths};
    }
};

module.exports = Game;