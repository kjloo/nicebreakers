"use strict";
exports.__esModule = true;
exports.generateTeamID = exports.generateGameCode = exports.generateCode = void 0;
// Generate code
function generateCode(codeLength) {
    var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var code = "";
    while (code.length < codeLength) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
}
exports.generateCode = generateCode;
// Create Game Code
function generateGameCode(games, codeLength) {
    if (!(games instanceof Map)) {
        return "";
    }
    var code = generateCode(codeLength);
    while (games.has(code)) {
        code = generateCode(codeLength);
    }
    return code;
}
exports.generateGameCode = generateGameCode;
// Create Team ID
function generateTeamID(teams) {
    if (!(teams instanceof Array)) {
        return -1;
    }
    // This should be fine as incrementing should yield a new number
    var teamID = Date.now();
    while (teams.find(function (team) { return team.id === teamID; }) !== undefined) {
        teamID = Date.now();
    }
    return teamID;
}
exports.generateTeamID = generateTeamID;
