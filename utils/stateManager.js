"use strict";
exports.__esModule = true;
exports.gameControllerFactory = exports.garbageCollection = exports.globalGames = void 0;
var movieController_1 = require("./movieController");
var filters = require('./filters');
// const assets
exports.globalGames = new Map();
// Garbage collection
function garbageCollection(games) {
    // remove any inactive game ids
    games.forEach(function (game, key, map) {
        if (filters.getPlayers(game).length === 0) {
            map["delete"](key);
            console.log("Removed inactive game: " + key);
        }
    });
}
exports.garbageCollection = garbageCollection;
// Factory
function gameControllerFactory(game) {
    return new movieController_1.MovieController(game);
}
exports.gameControllerFactory = gameControllerFactory;
