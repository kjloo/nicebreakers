"use strict";
exports.__esModule = true;
var enums_1 = require("./enums");
var stateManager_1 = require("./stateManager");
var acronym_1 = require("./acronym");
var express = require('express');
var path = require('path');
var codes = require('./codes');
var filters = require('./filters');
var structs = require('./structs');
var router = express.Router();
// consts
var codeLength = 4;
var playerCache = {};
// Middleware
router.use(express.static(path.join(globalThis.__basedir, 'build')));
// API requests
router.get('/acronym', function (req, res) {
    // Get code
    var gameID = req.query.gameID;
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
    var gameID = req.query.gameID;
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
    var gameID = req.query.gameID;
    var game = stateManager_1.globalGames.get(gameID);
    var players = filters.getPlayers(game);
    var data = {
        players: players
    };
    res.json(data);
});
router.get('/state', function (req, res) {
    var gameID = req.query.gameID;
    // retrieve game and return its teams
    var game = stateManager_1.globalGames.get(gameID);
    var state = (game !== undefined) ? game.state : enums_1.GameState.SETUP;
    var data = {
        state: state
    };
    res.json(data);
});
router.get('/teams', function (req, res) {
    var gameID = req.query.gameID;
    // retrieve game and return its teams
    var game = stateManager_1.globalGames.get(gameID);
    var teams = filters.getTeams(game);
    var data = {
        teams: teams
    };
    res.json(data);
});
router.get('/movie/game/', function (req, res) {
    var player = req.query.player;
    var gameID = req.query.gameID === undefined ? codes.generateGameCode(stateManager_1.globalGames, codeLength) : req.query.gameID;
    // register player name in cache
    playerCache[gameID] = player;
    //validateGameID(res, gameID);
    res.redirect("/movie/game/" + gameID);
});
router.get('/movie/game/:gameID', function (req, res, next) {
    // Handle direct route
    var gameID = req.params.gameID;
    validateGameID(res, gameID);
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
var validateGameID = function (res, gameID) {
    if (gameID.length !== codeLength) {
        res.send("Invalid GameID");
    }
    else if (stateManager_1.globalGames.get(gameID) === undefined) {
        var game = new structs.Game(gameID, enums_1.GameType.MOVIE, 0, [], new Map(), [], enums_1.GameState.SETUP, "");
        stateManager_1.globalGames.set(gameID, game);
        console.log("Created Game: " + gameID);
    }
};
exports["default"] = router;
