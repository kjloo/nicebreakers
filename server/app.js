const express = require('express');
const acronym = require('../utils/acronym');
const enums = require('../utils/enums');
const codes = require('../utils/codes');
const filters = require('../utils/filters');
const path = require('path');
const http = require('http');
const app = express();
const io = require('socket.io');

// Consts
const codeLength = 4;
const timeout = 60000; // 60 sec

// In memory data
let globalGames = [];
let globalPlayers = [];
let playerCache = {};
let globalTeams = [];
let globalMessages = [];

// Middleware
app.use(express.static(path.join(__dirname, 'build')));

// API requests
app.get('/acronym', function (req, res) {
    // Get code
    gameID = req.query.gameID;
    // Process
    data = {
        decode: acronym.processAcronym(gameID)
    }
    res.json(data);
})
app.get('/player', function (req, res) {
    // Check if player name is cached
    gameID = req.query.gameID;

    data = {}
    if (playerCache[gameID] !== undefined) {
        // put player name in cookie
        data.player = playerCache[gameID]
    }
    res.json(data)
})
app.get('/players', function (req, res) {
    let gameID = req.query.gameID;
    let players = filters.getByGameID(globalPlayers, gameID);
    let data = {
        players: players
    };

    res.json(data);
})

app.get('/teams', function (req, res) {
    let gameID = req.query.gameID;
    let teams = filters.getByGameID(globalTeams, gameID);
    let data = {
        teams: teams
    };

    res.json(data);
})

app.get('/movie/game/', function (req, res) {
    let player = req.query.player;
    let gameID = req.query.gameID === undefined ? codes.generateGameCode(globalGames, codeLength) : req.query.gameID;
    // register player name in cache
    playerCache[gameID] = player;

    //validateGameID(res, gameID);
    res.redirect(`/movie/game/${gameID}`);
});

app.get('/movie/game/:gameID', function (req, res, next) {
    // Handle direct route
    gameID = req.params.gameID;

    validateGameID(res, gameID);

    next();
});

// Routes
app.get(/^\/(.*)/, function (req, res) {
    serveHtml(res);
});

// Functions
// serve html
const serveHtml = (res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
}

const validateGameID = (res, gameID) => {
    if (gameID.length !== codeLength) {
        res.send("Invalid GameID");
    }
    else if (filters.getByID(globalGames, gameID) === undefined) {
        let game = {
            id: gameID,
            teamIndex: 0,
            teamsCache: [],
            answer: ""
        }
        globalGames.push(game);
    }
}

// Garbage collection
const garbageCollection = () => {
    // remove any inactive game ids
    globalGames = globalGames.filter((game) => {
        return (globalPlayers.find((player) => player.gameID === game.id) !== undefined);
    });
}

// Read/Write Game State
const getCurrentPlayer = (teamsCache, gameState) => {
    // Get player
    let player_index = teamsCache[gameState.teamIndex].player_index;
    let player = teamsCache[gameState.teamIndex].players[player_index];
    return player;
}

const getCurrentTeam = (teamsCache, gameState) => {
    let team = teamsCache[gameState.teamIndex];
    return team;
}

const incrementTeamIndex = (teamsCache, gameState) => {
    gameState.teamIndex++;
    // Check if valid
    if (gameState.teamIndex >= teamsCache.length) {
        gameState.teamIndex = 0;
    }
}

const incrementPlayerIndex = (teamsCache, gameState) => {
    teamsCache[gameState.teamIndex].player_index++;
    // Check if valid
    if (teamsCache[gameState.teamIndex].player_index >= teamsCache[gameState.teamIndex].players.length) {
        teamsCache[gameState.teamIndex].player_index = 0;
    }
}

const changeTeamTurns = (teamsCache, gameState) => {
    // Set old team to false
    let team = getCurrentTeam(teamsCache, gameState);
    team.turn = false;
    updateTeamState(team);

    // Increment
    incrementTeamIndex(teamsCache, gameState);
    // Set new team to true
    team = getCurrentTeam(teamsCache, gameState);
    team.turn = true;

    // Update global teams list
    updateTeamState(team);
}

const changePlayerTurns = (teamsCache, gameState) => {
    // Set old player to false
    let player = getCurrentPlayer(teamsCache, gameState);
    player.turn = false;

    // Update global players list
    updatePlayerState(player);

    // Change teams
    changeTeamTurns(teamsCache, gameState);
    // Set new player to true
    incrementPlayerIndex(teamsCache, gameState);
    player = getCurrentPlayer(teamsCache, gameState);
    player.turn = true;

    // Update global players list
    updatePlayerState(player);
}

const updatePlayerState = (update) => {
    globalPlayers = globalPlayers.map((player) => {
        return (player.id === update.id) ? update : player;
    });
}

const updateTeamState = (update) => {
    globalTeams = globalTeams.map((team) => {
        if (team.id === update.id) {
            // remove uneeded data
            const { players, player_index, ...rest } = update;
            return rest;
        } else {
            return team;
        }
    });
}

const resetGameState = (s, gameID) => {
    globalTeams = globalTeams.map((team) => {
        if (team.gameID === gameID) {
            return { ...team, score: 0, turn: false };
        } else {
            return team;
        }
    });
    globalPlayers = globalPlayers.map((player) => {
        if (player.gameID === gameID) {
            return { ...player, turn: false };
        } else {
            return player;
        }
    });
    updateTeams(s, gameID);
    updatePlayers(s, gameID);
}

// Get Chat
const getChat = (player) => {
    // Only return chat with matching team id
    let rc = globalMessages.find((chat) => chat.teamID === player.teamID);
    if (rc === undefined) {
        return [];
    }
    return rc;
}

// Game State Machine
const updateScore = (s, gameID, state) => {
    // give point based on state
    // give point to team with turn if GUESS else STEAL
    let point = (state === enums.GameState.GUESS);
    // get only teams in game
    let game = filters.getByID(globalGames, gameID);
    // update score
    game.teamsCache = game.teamsCache.map((team) => {
        if (team.turn === point) {
            return { ...team, score: team.score + 1 }
        } else {
            return team;
        }
    });
    // change turns
    incrementGameState(s, gameID);
    // back to beginning
    revealAnswer(s, gameID);
}

const gameStateMachine = (s, gameID, state, args) => {
    let game = filters.getByID(globalGames, gameID);
    switch (state) {
        case enums.GameState.SETUP:
            // TO DO: Should probably validate game
            // Send started to all
            setStarted(s, gameID, true);
            // Cache all teams in game
            let teamsCache = filters.getByGameID(globalTeams, gameID);
            // Store players on teams
            teamsCache = teamsCache.map((team) => {
                let players = filters.getByTeamID(globalPlayers, team.id);
                return { ...team, players: players, player_index: 0 };
            });
            game.teamsCache = teamsCache;
            // Set first turn
            incrementGameState(s, gameID);
            updateState(s, gameID, enums.GameState.ENTRY);
            break;
        case enums.GameState.ENTRY:
            game.answer = args.answer;
            updateState(s, gameID, enums.GameState.HINT);
            break;
        case enums.GameState.HINT:
            updateState(s, gameID, enums.GameState.STEAL);
            break;
        case enums.GameState.STEAL:
            if (args.correct === true) {
                updateScore(s, gameID, state);
            } else {
                updateState(s, gameID, enums.GameState.GUESS);
            }
            break;
        case enums.GameState.GUESS:
            if (args.correct === true) {
                updateScore(s, gameID, state);
            } else {
                // change turns
                incrementGameState(s, gameID);
                // back to beginning
                revealAnswer(s, gameID);
            }
            break;
        case enums.GameState.REVEAL:
            updateState(s, gameID, enums.GameState.ENTRY);
            break;
        case enums.GameState.END:
            // Reset to beginning
            setStarted(s, gameID, false);
            // Set winner
            setWinner(s, gameID);
            // Reset game
            resetGameState(s, gameID);
            updateState(s, gameID, enums.GameState.SETUP);
            break;
    }
}

// Execute code
setInterval(garbageCollection, timeout);

// Socket functions
const updatePlayers = (s, gameID) => {
    s.in(gameID).emit('update players', filters.getByGameID(globalPlayers, gameID));
}

const updateTeams = (s, gameID) => {
    s.in(gameID).emit('update teams', filters.getByGameID(globalTeams, gameID));
}

const addTeam = (s, gameID, team) => {
    // need to tell everyone changes in teams
    s.in(gameID).emit('add team', team);
}

const deleteTeam = (s, gameID, id) => {
    // need to tell everyone changes in teams
    s.in(gameID).emit('delete team', id);
}

const setStarted = (s, gameID, started) => {
    s.in(gameID).emit('set started', started);
}

const updateChat = (s, teamID, player) => {
    // should only go to members of team
    s.in(teamID).emit('team chat', getChat(player));
}

const revealAnswer = (s, gameID) => {
    let game = filters.getByID(globalGames, gameID);
    s.in(gameID).emit('reveal answer', game.answer);
    updateState(s, gameID, enums.GameState.REVEAL);
}

const updateState = (s, gameID, state) => {
    s.in(gameID).emit('set state', state);
}

const setWinner = (s, gameID) => {
    // Get winner
    let winner = globalTeams.reduce((pre, next) => {
        return pre.score > next.score ? pre : next;
    });
    // There might have been more than one team with the same score
    const tie = globalTeams.filter((team) => team.score === winner.score);
    if (tie.length > 1) {
        winner = undefined;
    }
    s.in(gameID).emit('set winner', winner);
}

const incrementGameState = (s, gameID) => {
    let gameState = filters.getByID(globalGames, gameID);
    let teamsCache = gameState.teamsCache;
    // Move the turn along
    changePlayerTurns(teamsCache, gameState);
    // Update sockets
    updatePlayers(s, gameID);
    updateTeams(s, gameID);
}

const server = http.createServer(app);
const socket = io(server);
socket.on('connection', (s) => {
    const gameID = s.handshake.query['gameID'];
    s.on('add player', ({ name }) => {
        s.join(gameID);
        // Check if team name and color exist
        if (globalPlayers.find((player) => (name === player.name) && (gameID === player.gameID)) !== undefined) {
            s.emit('exception', 'Name is taken!');
            return;
        }
        // Create Player
        player = {
            id: s.id,
            name: name,
            gameID: gameID,
            turn: false,
            teamID: -1
        }
        globalPlayers.push(player);
        s.emit('update player', player);
        updatePlayers(socket, gameID);
    });
    s.on('next state', ({ state, args }) => {
        gameStateMachine(socket, gameID, state, args);
    });
    s.on('join team', ({ teamID }) => {
        let player = filters.getByID(globalPlayers, s.id);
        if (player === undefined) {
            s.emit('exception', 'Player is not registered');
        } else {
            // change team
            s.leave(player.teamID);
            s.join(teamID);
            player.teamID = teamID;
            globalPlayers = globalPlayers.map((u) => {
                // If match return new player else keep old data
                return u.id === s.id ? player : u;
            });
            s.emit('update player', player);
            updatePlayers(socket, gameID);
            updateChat(socket, teamID, player);
        }
    });
    s.on('add team', ({ name, color }) => {
        // Check if team name and color exist
        if (globalTeams.find((team) => (name === team.name) && (gameID == team.gameID)) !== undefined) {
            s.emit('exception', 'Team name is taken!');
            return;
        }
        if (globalTeams.find((team) => (color === team.color) && (gameID == team.gameID)) !== undefined) {
            s.emit('exception', 'Color is taken!');
            return;
        }
        // Create Team
        team = {
            id: codes.generateTeamID(globalTeams),
            name: name,
            color: color,
            score: 0,
            gameID: gameID,
            turn: false,
            data: []
        }
        globalTeams.push(team);
        addTeam(socket, gameID, team);
    });
    s.on('delete team', ({ id }) => {
        globalTeams = globalTeams.filter((team) => {
            return (id !== team.id);
        });
        deleteTeam(socket, gameID, id);
    });
    s.on('team chat', ({ id, message }) => {
        let player = filters.getByID(globalPlayers, s.id);
        if (player === undefined || player.teamID !== id) {
            s.emit('exception', 'Not allowed to talk to another team.');
        } else {
            let = chatEntry = { player: player, message: message };
            let chat = globalMessages.find((chat) => chat.teamID === id);
            if (chat === undefined) {
                // Create new entry
                chat = {
                    teamID: id,
                    data: [chatEntry]
                }
                globalMessages.push(chat);
            } else {
                chat.data.push(chatEntry);
            }
            updateChat(socket, id, player);
        }
    });
    s.on('disconnect', () => {
        // Delete player
        globalPlayers = globalPlayers.filter((player) => player.id !== s.id);
        updatePlayers(socket, gameID);
    });
});

server.listen(3000);