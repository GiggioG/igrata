const config = require("./config.json");

const http = require("http");
const fs = require("fs");
const ws = require("ws");
const path = require("path");
const { isSymbol, getUUID, invertSymbol, getGameCode } = require("./lib_util.js");
const Game = require("./game.js");

let db = {};

let wss = new ws.Server({
    port: config.ports.websocket
});
wss.on("connection", sock => {
    sock.state = "waiting_for_game";
    sock.id = getUUID();
    sock.on("message", msg => {
        msg = msg.toString();
        msg = JSON.parse(msg);
        if (msg.type == "create_game") {
            if (sock.state != "waiting_for_game") {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "You can't create a game right now."
                }));
            }
            if (!isSymbol(msg.data.symbol)) {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "You must provide a symbol for you to be."
                }));
            }
            sock.symbol = msg.data.symbol;
            let gameId = getGameCode();
            db[gameId] = {
                game: new Game(sock.symbol),
                socks: [sock]
            };
            sock.game = gameId;
            sock.state = "in_game";
            return sock.send(JSON.stringify({
                type: "join_game",
                data: {
                    gameId,
                    symbol: sock.symbol,
                    gameData: db[gameId].game.serialise()
                }
            }));
        } else if (msg.type == "join_game") {
            if (sock.state != "waiting_for_game") {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "You can't join a game right now."
                }));
            }
            if (!msg?.data?.gameId) {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "You must specify a game id to join."
                }));
            }
            let gameId = msg.data.gameId;
            if (db[gameId] == undefined) {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "No game with this id exists."
                }));
            }
            if (db[gameId].socks.length > 1) {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "Game is full."
                }));
            }
            sock.game = gameId;
            db[gameId].socks.push(sock);
            sock.state = "in_game";
            sock.symbol = invertSymbol(db[gameId].socks[0].symbol);
            sock.send(JSON.stringify({
                type: "join_game",
                data: {
                    gameId,
                    symbol: sock.symbol,
                    gameData: db[gameId].game.serialise()
                }
            }));
            if(db[gameId].game.state == "ended"){
                sock.send(JSON.stringify({
                    type: "game_end",
                    data: {
                        win: db[gameId].game.win,
                        winPaths: db[gameId].game.winPaths
                    }
                }));
            }
        } else if (msg.type == "move") {
            if (sock.state != "in_game") {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "You need to be in a game to move."
                }));
            }
            if (sock.symbol != db[sock.game].game.turn) {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "It's not your turn to move."
                }));
            }
            if (msg.data.r == undefined || msg.data.c == undefined) {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "You need to specify a row and column."
                }));
            }
            let moved = db[sock.game].game.move(msg.data.r, msg.data.c);
            if (moved == false) {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "Illegal move."
                }));
            }
            db[sock.game].socks.forEach(s => {
                s.send(JSON.stringify({
                    type: "game_update",
                    data: db[sock.game].game.serialise()
                }));
            });
            let { win, winPaths } = db[sock.game].game.checkWin();
            if (win != null) {
                db[sock.game].state = "ended";
                db[sock.game].socks.forEach(s => {
                    s.send(JSON.stringify({
                        type: "game_end",
                        data: { win, winPaths }
                    }));
                });
            }
        } else if (msg.type == "reset") {
            if (sock.state != "in_game") {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "You need to be in a game to reset it."
                }));
            }
            if (db[sock.game].state != "ended") {
                return sock.send(JSON.stringify({
                    type: "error",
                    data: "The game has to end first."
                }));
            }
            db[sock.game].game = new Game(sock.symbol);
            db[sock.game].socks.forEach(s => {
                s.send(JSON.stringify({
                    type: "game_update",
                    data: db[sock.game].game.serialise()
                }));
            });
        }
    });
    sock.on("close", () => {
        if (sock.state == "in_game") {
            let gameId = sock.game;
            db[gameId].socks = db[gameId].socks.filter(s => (s.id != sock.id));
            if (db[gameId].socks.length == 0) {
                console.log(`Game #${gameId} was left with no players and got deleted.`);
                delete db[gameId];
            }
        }
    });
});

/// http server
const url = require("url");
let httpServer = http.createServer((req, res) => {
    let urlPath = url.parse(req.url).pathname;
    if (urlPath == '/') { urlPath = "/index.html" }
    if (!fs.existsSync('./public/' + path.posix.normalize(urlPath))) {
        res.writeHead(404);
        res.end();
        return;
    }
    fs.createReadStream('./public/' + path.posix.normalize(urlPath)).pipe(res);
});
httpServer.listen(8080);