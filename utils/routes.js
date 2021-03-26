const express = require('express');
const path = require('path');
const acronym = require('../utils/acronym');
const codes = require('../utils/codes');
const filters = require('../utils/filters');
const router = express.Router()

// consts
const codeLength = 4;

// In memory data
let globalGames = [];
let globalMessages = [];
let playerCache = {};

// Middleware
router.use(express.static(path.join(__basedir, 'build')));

// API requests
router.get('/acronym', function (req, res) {
    // Get code
    gameID = req.query.gameID;
    // Process
    data = {
        decode: acronym.processAcronym(gameID)
    }
    res.json(data);
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
    const game = filters.getByID(globalGames, gameID);
    const players = filters.getPlayers(game);
    const data = {
        players: players
    };

    res.json(data);
})

router.get('/teams', function (req, res) {
    let gameID = req.query.gameID;
    // retrieve game and return its teams
    let game = filters.getByID(globalGames, gameID);
    let data = {
        teams: game.teams
    };

    res.json(data);
})

router.get('/movie/game/', function (req, res) {
    let player = req.query.player;
    let gameID = req.query.gameID === undefined ? codes.generateGameCode(globalGames, codeLength) : req.query.gameID;
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
    else if (filters.getByID(globalGames, gameID) === undefined) {
        let game = {
            id: gameID,
            teamIndex: 0,
            teams: [],
            players: [],
            answer: ""
        }
        globalGames.push(game);
    }
}

module.exports = {
    router: router,
    globalGames: globalGames,
    globalMessages: globalMessages
}