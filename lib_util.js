const crypto = require("crypto");

const getUUID = () => crypto.randomBytes(16).toString("hex");
const isSymbol = s => (s=='X' || s=='O');
const invertSymbol = s => {
    if (s == 'X') { return 'O'; }
    else if (s == 'O') { return 'X'; }
};

module.exports = {
    getUUID, isSymbol, invertSymbol
}