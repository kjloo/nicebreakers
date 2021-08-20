"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.GameController = void 0;
var enums_1 = require("./enums");
var logger_1 = require("./logger");
var structs_1 = require("./structs");
var emitter = require('./emitter');
var GameController = /** @class */ (function () {
    function GameController(game) {
        this.id = game.id;
    }
    // Read/Write Game State
    GameController.prototype.isGameStarted = function (game) {
        return game.state !== enums_1.GameState.SETUP;
    };
    GameController.prototype.resetGameState = function (s, game) {
        logger_1["default"].info('Resetting game state');
        // Delete cached players
        game.cachedPlayers = [];
        game.teams = game.teams.map(function (team) {
            return __assign(__assign({}, team), { score: 0, turn: false, players: team.players.map(function (player) {
                    return __assign(__assign({}, player), { turn: false });
                }), playerIndex: 0 });
        });
        game.teamIndex = 0;
        emitter.updateTeams(s, game);
        emitter.updatePlayers(s, game);
    };
    GameController.prototype.gameStateMachine = function (s, game, state, args) {
    };
    GameController.prototype.createPlayer = function (id, name) {
        return new structs_1.Player(id, enums_1.PlayerType.PLAYER, name, false, -1);
    };
    GameController.prototype.changeTeamTurns = function (game) {
        // Set old team to false
        var team = this.getCurrentTeam(game);
        team.turn = false;
        // Increment
        this.incrementTeamIndex(game);
        // Set new team to true
        team = this.getCurrentTeam(game);
        team.turn = true;
    };
    GameController.prototype.getCurrentTeam = function (game) {
        return game.teams[game.teamIndex];
    };
    GameController.prototype.incrementTeamIndex = function (game) {
        game.teamIndex++;
        // Check if valid
        if (game.teamIndex >= game.teams.length) {
            game.teamIndex = 0;
        }
    };
    return GameController;
}());
exports.GameController = GameController;
;
