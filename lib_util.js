const crypto = require("crypto");

const getUUID = () => crypto.randomBytes(16).toString("hex");
const isSymbol = s => (s=='X' || s=='O');
const invertSymbol = s => {
    if (s == 'X') { return 'O'; }
    else if (s == 'O') { return 'X'; }
};
const getRandomCapital = () => String.fromCharCode(Math.floor(Math.random()*26) + 65);
const getGameCode = () => Array(6).fill().map(getRandomCapital).join('');

module.exports = {
    getUUID, isSymbol, invertSymbol, getGameCode
}