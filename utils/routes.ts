import { GameState, GameType } from './enums';
import { globalGames } from './stateManager';
import { processAcronym } from './acronym';
const express = require('express');
const path = require('path');
const codes = require('./codes');
const filters = require('./filters');
const structs = require('./structs');
const router = express.Router()

// consts
const codeLength = 4;

let playerCache = {};

// Middleware
router.use(express.static(path.join(globalThis.__basedir, 'build')));

// API requests
router.get('/acronym', function (req, res) {
    // Get code
    let gameID: string = req.query.gameID;
    if (gameID.length !== codeLength) {
        console.log("Invalid Code: " + gameID);
        res.sendStatus(404);
    } else {
        // Process
        let data = {
            decode: processAcronym(gameID)
        }
        res.json(data);
    }
})

router.get('/player', function (req, res) {
    // Check if player name is cached
    let gameID: string = req.query.gameID;

    if (playerCache[gameID] === undefined) {
        res.json({})
    }
    // put player name in cookie
    const data = {
        player: playerCache[gameID]
    }
    res.json(data)
})

router.get('/players', function (req, res) {
    const gameID = req.query.gameID;
    const game = globalGames.get(gameID);
    const players = filters.getPlayers(game);
    const data = {
        players: players
    };
    res.json(data);
})

router.get('/state', function (req, res) {
    const gameID: string = req.query.gameID;
    // retrieve game and return its teams
    const game = globalGames.get(gameID);
    const state = (game !== undefined) ? game.state : GameState.SETUP;
    let data = {
        state: state
    };

    res.json(data);
})

router.get('/teams', function (req, res) {
    const gameID: string = req.query.gameID;
    // retrieve game and return its teams
    const game = globalGames.get(gameID);
    const teams = filters.getTeams(game);
    let data = {
        teams: teams
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
    const gameID: string = req.params.gameID;

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
    res.sendFile(path.join(globalThis.__basedir, 'build', 'index.html'));
}

const validateGameID = (res, gameID) => {
    if (gameID.length !== codeLength) {
        res.send("Invalid GameID");
    }
    else if (globalGames.get(gameID) === undefined) {
        let game = new structs.Game(gameID, GameType.MOVIE, 0, [], new Map(), [], GameState.SETUP, "");
        globalGames.set(gameID, game);
        console.log("Created Game: " + gameID);
    }
}

export default router;