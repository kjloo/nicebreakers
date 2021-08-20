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
exports.TriviaController = void 0;
var enums_1 = require("./enums");
var gameController_1 = require("./gameController");
var emitter = require('./emitter');
var TriviaController = /** @class */ (function (_super) {
    __extends(TriviaController, _super);
    function TriviaController() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TriviaController.prototype.sendState = function (s, game) {
        // Update sockets
        emitter.updateTeams(s, game);
    };
    TriviaController.prototype.nextRound = function (s, game) {
        this.sendState(s, game);
        // back to beginning
        emitter.revealAnswer(s, game);
        emitter.updateState(s, game, enums_1.GameState.REVEAL);
    };
    TriviaController.prototype.updateScore = function (s, game, state, correct) {
        // check if correct answer given
        if (correct) {
            // update score
            game.teams = game.teams.map(function (team) {
                if (team.turn) {
                    return __assign(__assign({}, team), { score: team.score + 1 });
                }
                else {
                    return team;
                }
            });
            this.nextRound(s, game);
        }
        else {
            if (state === enums_1.GameState.GUESS) {
                // switch turns
                this.changeTeamTurns(game);
                this.sendState(s, game);
                emitter.updateState(s, game, enums_1.GameState.STEAL);
            }
            else {
                this.nextRound(s, game);
            }
        }
    };
    TriviaController.prototype.buzzIn = function (s, game, teamID) {
        // Prevent race condition. Make sure only 1 team is set
        if (game.teams.some(function (team) { return team.turn; })) {
            return;
        }
        // Set team turn
        game.teams = game.teams.map(function (team) {
            if (team.id !== teamID) {
                return team;
            }
            return __assign(__assign({}, team), { turn: true });
        });
        this.sendState(s, game);
    };
    TriviaController.prototype.gameStateMachine = function (s, game, state, args) {
        switch (state) {
            case enums_1.GameState.SETUP:
                emitter.updateState(s, game, enums_1.GameState.ENTRY);
                break;
            case enums_1.GameState.ENTRY:
                // Clear turns
                game.teams = game.teams.map(function (team) {
                    return __assign(__assign({}, team), { turn: false });
                });
                this.sendState(s, game);
                emitter.updateState(s, game, enums_1.GameState.HINT);
                break;
            case enums_1.GameState.HINT:
                this.buzzIn(s, game, args.teamID);
                emitter.updateState(s, game, enums_1.GameState.GUESS);
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
    return TriviaController;
}(gameController_1.GameController));
exports.TriviaController = TriviaController;
;
