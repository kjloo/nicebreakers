"use strict";
exports.__esModule = true;
exports.ChatEntry = exports.Game = exports.Team = exports.Player = void 0;
var enums_1 = require("./enums");
var Player = /** @class */ (function () {
    function Player(id, type, name, turn, teamID) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.turn = turn;
        this.teamID = teamID;
    }
    return Player;
}());
exports.Player = Player;
var Team = /** @class */ (function () {
    function Team(id, name, color, score, turn, chat, players, playerIndex) {
        if (name === void 0) { name = ''; }
        if (color === void 0) { color = ''; }
        if (score === void 0) { score = 0; }
        if (turn === void 0) { turn = false; }
        if (chat === void 0) { chat = []; }
        if (players === void 0) { players = []; }
        if (playerIndex === void 0) { playerIndex = 0; }
        this.id = id;
        this.name = name;
        this.color = color;
        this.score = score;
        this.turn = turn;
        this.chat = chat;
        this.players = players;
        this.playerIndex = playerIndex;
    }
    return Team;
}());
exports.Team = Team;
var Game = /** @class */ (function () {
    function Game(id, type, teamIndex, teams, players, cachedPlayers, state, answer) {
        if (type === void 0) { type = enums_1.GameType.MOVIE; }
        if (teamIndex === void 0) { teamIndex = 0; }
        if (teams === void 0) { teams = []; }
        if (players === void 0) { players = new Map(); }
        if (cachedPlayers === void 0) { cachedPlayers = []; }
        if (state === void 0) { state = enums_1.GameState.SETUP; }
        if (answer === void 0) { answer = ""; }
        this.id = id;
        this.type = type;
        this.teamIndex = teamIndex;
        this.teams = teams;
        this.players = players;
        this.cachedPlayers = cachedPlayers;
        this.state = state;
        this.answer = answer;
    }
    return Game;
}());
exports.Game = Game;
var ChatEntry = /** @class */ (function () {
    function ChatEntry(name, message) {
        this.name = name;
        this.message = message;
    }
    return ChatEntry;
}());
exports.ChatEntry = ChatEntry;
