"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.MovieController = void 0;
var logger_1 = require("./logger");
var enums_1 = require("./enums");
var gameController_1 = require("./gameController");
var emitter = require('./emitter');
var MovieController = /** @class */ (function (_super) {
    __extends(MovieController, _super);
    function MovieController() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MovieController.prototype.getCurrentPlayer = function (game) {
        var team = this.getCurrentTeam(game);
        if (team === undefined) {
            logger_1["default"].error("Invalid team index " + game.teamIndex);
            return undefined;
        }
        // Get player
        return team.players[team.playerIndex];
    };
    MovieController.prototype.incrementPlayerIndex = function (game) {
        var teams = game.teams;
        teams[game.teamIndex].playerIndex++;
        // Check if valid
        if (teams[game.teamIndex].playerIndex >= teams[game.teamIndex].players.length) {
            teams[game.teamIndex].playerIndex = 0;
        }
    };
    MovieController.prototype.changePlayerTurns = function (game) {
        // Set old player to false
        var player = this.getCurrentPlayer(game);
        if (player === undefined) {
            logger_1["default"].error("Could not get player!");
            console.error("Could not get player!");
            return;
        }
        player.turn = false;
        // Move to next player
        this.incrementPlayerIndex(game);
        // Change teams
        this.changeTeamTurns(game);
        // Set new player to true
        player = this.getCurrentPlayer(game);
        player.turn = true;
    };
    // Game State Machine
    MovieController.prototype.incrementGameState = function (s, game) {
        // Move the turn along
        this.changePlayerTurns(game);
        // Update sockets
        emitter.updatePlayers(s, game);
        emitter.updateTeams(s, game);
    };
    MovieController.prototype.nextRound = function (s, game) {
        // change turns
        this.incrementGameState(s, game);
        // back to beginning
        emitter.revealAnswer(s, game);
        emitter.updateState(s, game, enums_1.GameState.REVEAL);
    };
    MovieController.prototype.updateScore = function (s, game, state, correct) {
        // check if correct answer given
        if (correct) {
            // give point based on state
            // give point to team with turn if GUESS else STEAL
            var point_1 = (state === enums_1.GameState.GUESS);
            // update score
            game.teams = game.teams.map(function (team) {
                if (team.turn === point_1) {
                    return __assign(__assign({}, team), { score: team.score + 1 });
                }
                else {
                    return team;
                }
            });
            this.nextRound(s, game);
        }
        else {
            if (state === enums_1.GameState.STEAL) {
                emitter.updateState(s, game, enums_1.GameState.GUESS);
            }
            else {
                this.nextRound(s, game);
            }
        }
    };
    MovieController.prototype.gameStateMachine = function (s, game, state, args) {
        switch (state) {
            case enums_1.GameState.SETUP:
                // Set first turn
                this.incrementGameState(s, game);
                emitter.updateState(s, game, enums_1.GameState.ENTRY);
                break;
            case enums_1.GameState.ENTRY:
                game.answer = args.answer;
                emitter.updateState(s, game, enums_1.GameState.HINT);
                break;
            case enums_1.GameState.HINT:
                emitter.updateState(s, game, enums_1.GameState.STEAL);
                break;
            case enums_1.GameState.STEAL:
            case enums_1.GameState.GUESS:
                this.updateScore(s, game, state, args.correct);
                break;
            case enums_1.GameState.REVEAL:
                emitter.updateState(s, game, enums_1.GameState.ENTRY);
                break;
            case enums_1.GameState.END:
                // Reset game
                emitter.updateState(s, game, enums_1.GameState.SETUP);
                // Set winner
                emitter.setWinner(s, game);
                // Reset to beginning
                this.resetGameState(s, game);
                break;
        }
    };
    return MovieController;
}(gameController_1.GameController));
exports.MovieController = MovieController;
;
