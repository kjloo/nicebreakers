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
var logger_1 = require("./logger");
var enums_1 = require("./enums");
var gameController_1 = require("./gameController");
var emitter_1 = require("./emitter");
var TriviaController = /** @class */ (function (_super) {
    __extends(TriviaController, _super);
    function TriviaController(s, game) {
        var _this = _super.call(this, s, game) || this;
        _this.questions = [];
        _this.category = [];
        return _this;
    }
    TriviaController.prototype.getNextQuestion = function () {
        // Check if there is a question left in the category
        if (this.category.length === 0) {
            // Load the next category
            if (this.questions.length === 0) {
                // No more questions left
                return undefined;
            }
            // store category
            var questions_1 = this.questions.pop();
            this.category = questions_1.questions.reverse().map(function (question) {
                return __assign(__assign({}, question), { category: questions_1.category });
            });
        }
        return this.category.pop();
    };
    TriviaController.prototype.sendState = function (s, game) {
        // Update sockets
        emitter_1.updateTeams(s, game);
    };
    TriviaController.prototype.nextRound = function (s, game) {
        this.sendState(s, game);
        // back to beginning
        emitter_1.revealAnswer(s, game);
        emitter_1.updateState(s, game, enums_1.GameState.REVEAL);
    };
    /**
     * Create a new list of teams with updated score.
     * @param game current game context
     * @param delta change to the score
     * @returns array of teams
     */
    TriviaController.prototype.updateScore = function (game, delta) {
        // update score
        return game.teams.map(function (team) {
            if (team.turn) {
                return __assign(__assign({}, team), { score: team.score + delta });
            }
            else {
                return team;
            }
        });
    };
    /**
     * Execute logic when an answer is received
     * @param s SocketIO connected to client
     * @param game current game context
     * @param state current game state
     * @param correct whether a correct answer was provided
     */
    TriviaController.prototype.handleAnswer = function (s, game, state, correct) {
        // check if correct answer given
        if (correct) {
            // update score
            game.teams = this.updateScore(game, game.question.points);
            this.nextRound(s, game);
        }
        else {
            if (state === enums_1.GameState.GUESS) {
                // deduct points
                game.teams = this.updateScore(game, -game.question.points);
                // switch turns
                this.changeTeamTurns(game);
                this.sendState(s, game);
                emitter_1.updateState(s, game, enums_1.GameState.STEAL);
            }
            else {
                this.nextRound(s, game);
            }
        }
    };
    /**
     * Set game context based on which team buzzes in.
     * @param s SocketIO connected to client
     * @param game current game context
     * @param teamID ID of team that buzzed in
     */
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
            game.teamIndex = game.teams.indexOf(team);
            return __assign(__assign({}, team), { turn: true });
        });
        this.sendState(s, game);
    };
    /**
     * Set game state for each round.
     * @param s SocketIO connected to client
     * @param game current game context
     */
    TriviaController.prototype.entryState = function (s, game) {
        // Clear turns
        game.teams = game.teams.map(function (team) {
            return __assign(__assign({}, team), { turn: false });
        });
        this.sendState(s, game);
        // Update question
        var question = this.getNextQuestion();
        // If question is null, game is over
        if (question === undefined) {
            this.endGame(s, game);
        }
        else {
            game.question = question;
            emitter_1.revealAnswer(s, game);
            emitter_1.updateState(s, game, enums_1.GameState.ENTRY);
        }
    };
    /**
     * Responsible for handling transition to next game state
     * @param s SocketIO server object connected to client
     * @param game Game context object
     * @param state The current game state
     * @param args Additional arguments
     */
    TriviaController.prototype.gameStateMachine = function (s, game, state, args) {
        switch (state) {
            case enums_1.GameState.SETUP:
                this.entryState(s, game);
                break;
            case enums_1.GameState.ENTRY:
                emitter_1.updateState(s, game, enums_1.GameState.HINT);
                break;
            case enums_1.GameState.HINT:
                this.buzzIn(s, game, args.teamID);
                emitter_1.updateState(s, game, enums_1.GameState.GUESS);
                break;
            case enums_1.GameState.STEAL:
            case enums_1.GameState.GUESS:
                this.handleAnswer(s, game, state, args.correct);
                break;
            case enums_1.GameState.REVEAL:
                this.entryState(s, game);
                break;
            case enums_1.GameState.END:
                this.endGame(s, game);
                break;
        }
    };
    /**
     * Receives JSON file from client and loads it as game context
     * @param s SocketIO connected to client
     * @param gameID Game ID to send data to
     * @param data Data receieved from client. Should be a JSON file
     * @returns success/failure
     */
    TriviaController.prototype.loadData = function (s, gameID, data) {
        try {
            this.questions = JSON.parse(data.toString()).sort(function () { return Math.random() - 0.5; });
            emitter_1.setReady(s, gameID, true);
        }
        catch (err) {
            logger_1["default"].error("Invalid JSON file: " + err);
            return false;
        }
        return true;
    };
    return TriviaController;
}(gameController_1.GameController));
exports.TriviaController = TriviaController;
;
