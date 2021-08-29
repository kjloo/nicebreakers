"use strict";
exports.__esModule = true;
exports.gameControllerFactory = exports.garbageCollection = exports.globalGames = void 0;
var enums_1 = require("./enums");
var movieController_1 = require("./movieController");
var triviaController_1 = require("./triviaController");
var filters_1 = require("./filters");
// const assets
exports.globalGames = new Map();
// Garbage collection
function garbageCollection(games) {
    // remove any inactive game ids
    games.forEach(function (game, key, map) {
        if (filters_1.getPlayers(game).length === 0) {
            map["delete"](key);
            console.log("Removed inactive game: " + key);
        }
    });
}
exports.garbageCollection = garbageCollection;
// Factory
function gameControllerFactory(io, game) {
    if (game.type == enums_1.GameType.MOVIE) {
        return new movieController_1.MovieController(io, game);
    }
    else if (game.type == enums_1.GameType.TRIVIA) {
        return new triviaController_1.TriviaController(io, game);
    }
    return null;
}
exports.gameControllerFactory = gameControllerFactory;
