import { GameState, GameType } from './enums';
import { gameControllerFactory, globalGames } from './stateManager';
import { processAcronym } from './acronym';
import { generateGameCode } from './codes';
import { getPlayers, getTeams } from './filters';
import { Game, Player, Question, Team } from './structs';
import * as express from 'express';
import { Request, Response } from 'express';
import { GameController } from './gameController';
const path = require('path');
const router = express.Router();

// consts
const codeLength: number = 4;

let playerCache = {};

// Middleware
router.use(express.static(path.join(globalThis.__basedir, 'build')));

// API requests
router.get('/acronym', function (req: Request, res: Response) {
    // Get code
    let gameID: string = req.query.gameID.toString();
    if (gameID.length !== codeLength) {
        console.log("Invalid Code: " + gameID);
        res.sendStatus(404);
    } else {
        // Process
        let data = {
            decode: processAcronym(gameID)
        };
        res.json(data);
    }
});

router.get('/player', function (req: Request, res: Response) {
    // Check if player name is cached
    let gameID: string = req.query.gameID.toString();

    if (playerCache[gameID] === undefined) {
        res.json({});
    }
    // put player name in cookie
    const data = {
        player: playerCache[gameID]
    };
    res.json(data);
});

router.get('/players', function (req, res) {
    const gameID: string = req.query.gameID.toString();
    const game: Game = globalGames.get(gameID);
    const players: Array<Player> = getPlayers(game);
    const data = {
        players: players
    };
    res.json(data);
});

router.get('/state', function (req, res) {
    const gameID: string = req.query.gameID.toString();
    // retrieve game and return its teams
    const game: Game = globalGames.get(gameID);
    const state: GameState = (game !== undefined) ? game.state : GameState.SETUP;
    let data = {
        state: state
    };

    res.json(data);
});

router.get('/ready', function (req, res) {
    const gameID: string = req.query.gameID.toString();
    // retrieve game and return its teams
    const game: Game = globalGames.get(gameID);
    const ready: boolean = (game !== undefined) ? game.controller.ready : false;
    let data = {
        ready: ready
    };

    res.json(data);
});

router.get('/question', function (req, res) {
    const gameID: string = req.query.gameID.toString();
    // retrieve game and return its teams
    const game: Game = globalGames.get(gameID);
    const question: Question = (game !== undefined) ? game.question : undefined;
    let data = {
        question: question
    };

    res.json(data);
});

router.get('/args', function (req, res) {
    const gameID: string = req.query.gameID.toString();
    // retrieve game and return its teams
    const game: Game = globalGames.get(gameID);
    const args: any = (game !== undefined) ? game.args : {};
    let data = {
        args: args
    };

    res.json(data);
});

router.get('/teams', function (req, res) {
    const gameID: string = req.query.gameID.toString();
    // retrieve game and return its teams
    const game: Game = globalGames.get(gameID);
    const teams: Array<Team> = getTeams(game);
    let data = {
        teams: teams
    };

    res.json(data);
});

router.get('/game/:gameID', function (req, res) {
    // Handle direct route
    const gameID: string = req.params.gameID.toString();

    const game: Game = validateGameID(gameID);
    if (game === undefined) {
        console.error("Invalid game: " + gameID);
        res.status(404).send("Invalid game: " + gameID);
        return;
    }

    let gamePath: string[] = [];
    if (game.type === GameType.MOVIE) {
        gamePath.push('/movie');
    } else if (game.type === GameType.TRIVIA) {
        gamePath.push('/trivia');
    } else if (game.type === GameType.TOPFIVE) {
        gamePath.push('/topfive');
    } else if (game.type === GameType.EQUALMATCH) {
        gamePath.push('/equalmatch');
    } else if (game.type === GameType.HOTTAKE) {
        gamePath.push('/hottake');
    }
    gamePath.push('game');
    gamePath.push(gameID);
    res.redirect(path.join(...gamePath));
});

router.get('/game/', function (req, res) {
    const player: string = req.query.player.toString();
    const gameType: GameType = Number(req.query.gameType);
    const gameID: string = req.query.gameID === undefined ? generateGameCode(globalGames, codeLength) : req.query.gameID.toString();
    // register game
    if (registerGame(gameID, gameType)) {
        // register player name in cache
        playerCache[gameID] = player;
        console.log(playerCache);
    }
    res.redirect(`/game/${gameID}`);
});

router.get([
    "/movie/game/:gameID",
    "/trivia/game/:gameID",
    "/topfive/game/:gameID",
    "/equalmatch/game/:gameID",
    "/hottake/game/:gameID",
], function (req, res, next) {
    // Handle direct route
    const gameID: string = req.params.gameID.toString();

    const game: Game = validateGameID(gameID);
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
const serveHtml = (res) => {
    res.sendFile(path.join(globalThis.__basedir, 'build', 'index.html'));
};

export function registerGame(gameID: string, gameType: GameType): boolean {
    if (globalGames.get(gameID)) {
        console.log("Game " + gameID + " exists");
        return false;
    }
    const game: Game = new Game(gameID, gameType);
    // Create controller for game
    const controller: GameController = gameControllerFactory(game);
    console.log("Created game " + controller.id);
    game.controller = controller;
    globalGames.set(gameID, game);
    return true;
}

export function validateGameID(gameID: string): Game {
    if (gameID.length !== codeLength) {
        return undefined;
    }
    return globalGames.get(gameID);
}

export default router;