const express = require('express');
const path = require('path');
const acronym = require('./acronym');
const codes = require('./codes');
const enums = require('./enums');
const filters = require('./filters');
const structs = require('./structs');
const movieState = require('./movieState');
const router = express.Router()

// consts
const codeLength = 4;

let playerCache = {};

// Middleware
router.use(express.static(path.join(__basedir, 'build')));

// API requests
router.get('/acronym', function (req, res) {
    // Get code
    gameID = req.query.gameID;
    if (gameID.length !== codeLength) {
        console.log("Invalid Code: " + gameID);
        res.sendStatus(404);
    } else {
        // Process
        data = {
            decode: acronym.processAcronym(gameID)
        }
        res.json(data);
    }
})

router.get('/player', function (req, res) {
    // Check if player name is cached
    gameID = req.query.gameID;

    data = {}
    if (playerCache[gameID] !== undefined) {
        // put player name in cookie
        data.player = playerCache[gameID]
    }
    res.json(data)
})

router.get('/players', function (req, res) {
    const gameID = req.query.gameID;
    const game = movieState.globalGames.get(gameID);
    const players = filters.getPlayers(game);
    const data = {
        players: players
    };
    res.json(data);
})

router.get('/state', function (req, res) {
    const gameID = req.query.gameID;
    // retrieve game and return its teams
    const game = movieState.globalGames.get(gameID);
    const state = (game !== undefined) ? game.state : enums.GameState.SETUP;
    let data = {
        state: state
    };

    res.json(data);
})

router.get('/teams', function (req, res) {
    const gameID = req.query.gameID;
    // retrieve game and return its teams
    const game = movieState.globalGames.get(gameID);
    const teams = filters.getTeams(game);
    let data = {
        teams: teams
    };

    res.json(data);
})

router.get('/movie/game/', function (req, res) {
    let player = req.query.player;
    let gameID = req.query.gameID === undefined ? codes.generateGameCode(movieState.globalGames, codeLength) : req.query.gameID;
    // register player name in cache
    playerCache[gameID] = player;
    //validateGameID(res, gameID);
    res.redirect(`/movie/game/${gameID}`);
});

router.get('/movie/game/:gameID', function (req, res, next) {
    // Handle direct route
    gameID = req.params.gameID;

    validateGameID(res, gameID);

    next();
});

// Routes
router.get(/^\/(.*)/, function (req, res) {
    serveHtml(res);
});

// Functions
// serve html
const serveHtml = (res) => {
    res.sendFile(path.join(__basedir, 'build', 'index.html'));
}

const validateGameID = (res, gameID) => {
    if (gameID.length !== codeLength) {
        res.send("Invalid GameID");
    }
    else if (movieState.globalGames.get(gameID) === undefined) {
        let game = new structs.Game(gameID, 0, [], new Map(), [], enums.GameState.SETUP, "");
        movieState.globalGames.set(gameID, game);
        console.log("Created Game: " + gameID);
    }
}

module.exports = {
    router: router
}