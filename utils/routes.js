"use strict";
exports.__esModule = true;
exports.validateGameID = exports.registerGame = void 0;
var enums_1 = require("./enums");
var stateManager_1 = require("./stateManager");
var acronym_1 = require("./acronym");
var codes_1 = require("./codes");
var filters_1 = require("./filters");
var structs_1 = require("./structs");
var express = require("express");
var path = require('path');
var router = express.Router();
// consts
var codeLength = 4;
var playerCache = {};
// Middleware
router.use(express.static(path.join(globalThis.__basedir, 'build')));
// API requests
router.get('/acronym', function (req, res) {
    // Get code
    var gameID = req.query.gameID.toString();
    if (gameID.length !== codeLength) {
        console.log("Invalid Code: " + gameID);
        res.sendStatus(404);
    }
    else {
        // Process
        var data = {
            decode: acronym_1.processAcronym(gameID)
        };
        res.json(data);
    }
});
router.get('/player', function (req, res) {
    // Check if player name is cached
    var gameID = req.query.gameID.toString();
    if (playerCache[gameID] === undefined) {
        res.json({});
    }
    // put player name in cookie
    var data = {
        player: playerCache[gameID]
    };
    res.json(data);
});
router.get('/players', function (req, res) {
    var gameID = req.query.gameID.toString();
    var game = stateManager_1.globalGames.get(gameID);
    var players = filters_1.getPlayers(game);
    var data = {
        players: players
    };
    res.json(data);
});
router.get('/state', function (req, res) {
    var gameID = req.query.gameID.toString();
    // retrieve game and return its teams
    var game = stateManager_1.globalGames.get(gameID);
    var state = (game !== undefined) ? game.state : enums_1.GameState.SETUP;
    var data = {
        state: state
    };
    res.json(data);
});
router.get('/teams', function (req, res) {
    var gameID = req.query.gameID.toString();
    // retrieve game and return its teams
    var game = stateManager_1.globalGames.get(gameID);
    var teams = filters_1.getTeams(game);
    var data = {
        teams: teams
    };
    res.json(data);
});
router.get('/game/:gameID', function (req, res) {
    // Handle direct route
    var gameID = req.params.gameID.toString();
    var game = validateGameID(gameID);
    if (game === undefined) {
        console.error("Invalid game: " + gameID);
        res.status(404).send("Invalid game: " + gameID);
        return;
    }
    var gamePath = [];
    if (game.type === enums_1.GameType.MOVIE) {
        gamePath.push('/movie');
    }
    else if (game.type === enums_1.GameType.TRIVIA) {
        gamePath.push('/trivia');
    }
    gamePath.push('game');
    gamePath.push(gameID);
    res.redirect(path.join.apply(path, gamePath));
});
router.get('/game/', function (req, res) {
    var player = req.query.player.toString();
    var gameType = Number(req.query.gameType);
    var gameID = req.query.gameID === undefined ? codes_1.generateGameCode(stateManager_1.globalGames, codeLength) : req.query.gameID.toString();
    // register game
    if (registerGame(gameID, gameType)) {
        // register player name in cache
        playerCache[gameID] = player;
    }
    res.redirect("/game/" + gameID);
});
router.get(["/movie/game/:gameID", "/trivia/game/:gameID"], function (req, res, next) {
    // Handle direct route
    var gameID = req.params.gameID.toString();
    var game = validateGameID(gameID);
    if (game === undefined) {
        console.error("Invalid game: " + gameID);
        res.send("Invalid game: " + gameID);
        return;
    }
    next();
});
// Routes
router.get(/^\/(.*)/, function (req, res) {
    serveHtml(res);
});
// Functions
// serve html
var serveHtml = function (res) {
    res.sendFile(path.join(globalThis.__basedir, 'build', 'index.html'));
};
function registerGame(gameID, gameType) {
    if (stateManager_1.globalGames.get(gameID)) {
        console.log("Game " + gameID + " exists");
        return false;
    }
    var game = new structs_1.Game(gameID, gameType, 0, [], new Map(), [], enums_1.GameState.SETUP, "");
    stateManager_1.globalGames.set(gameID, game);
    return true;
}
exports.registerGame = registerGame;
function validateGameID(gameID) {
    if (gameID.length !== codeLength) {
        return undefined;
    }
    return stateManager_1.globalGames.get(gameID);
}
exports.validateGameID = validateGameID;
exports["default"] = router;
