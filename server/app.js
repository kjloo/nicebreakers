const express = require('express');
const acronym = require('../utils/acronym');
const enums = require('../utils/enums');
const path = require('path');
const http = require('http');
const app = express();
const io = require('socket.io');

// consts
const codeLength = 4;
const timeout = 60000; // 60 sec

// In memory data
let global_games = [];
let global_players = [];
let player_cache = {};
let global_teams = [];
let global_messages = [];

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
    if (player_cache[gameID] !== undefined) {
        // put player name in cookie
        data.player = player_cache[gameID]
    }
    res.json(data)
})
app.get('/players', function (req, res) {
    gameID = req.query.gameID;
    players = getPlayersInGame(gameID);
    data = {
        players: players
    };

    res.json(data);
})

app.get('/teams', function (req, res) {
    gameID = req.query.gameID;
    teams = getTeams(gameID);
    data = {
        teams: teams
    };

    res.json(data);
})

app.get('/movie/game/', function (req, res) {
    let player = req.query.player;
    let gameID = req.query.gameID === undefined ? generateGameCode() : req.query.gameID;
    // register player name in cache
    player_cache[gameID] = player;

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
    else if (getGame(gameID) === undefined) {
        let game = {
            id: gameID,
            teamIndex: 0,
            teamsCache: [],
            answer: ""
        }
        global_games.push(game);
    }
}

// Garbage collection
const garbageCollection = () => {
    // remove any inactive game ids
    global_games = global_games.filter((game) => {
        return (global_players.find((player) => player.gameID === game.id) !== undefined);
    });
}

// Generate code
const generateCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    while (code.length < codeLength) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
}

// Create Game Code
const generateGameCode = () => {
    let code = generateCode();
    while (getGame(code) !== undefined) {
        code = generateCode();
    }
    return code;
}

// Create Team ID
const generateTeamID = () => {
    // This should be fine as incrementing should yield a new number
    let teamID = Date.now();
    while (global_teams.find((team) => team.id === teamID) !== undefined) {
        teamID = Date.now();
    }
    return teamID;
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

// Get Game
const getGame = (gameID) => {
    return global_games.find((game) => game.id === gameID);
}

// Get Player
const getPlayer = (playerID) => {
    return global_players.find((player) => player.id === playerID);
}

const updatePlayerState = (update) => {
    global_players = global_players.map((player) => {
        return (player.id === update.id) ? update : player;
    });
}

// Get Players
const getPlayersInGame = (gameID) => {
    return global_players.filter((player) => player.gameID === gameID);
}

const getPlayersOnTeam = (teamID) => {
    return global_players.filter((player) => player.teamID === teamID);
}

// Get Teams
const getTeams = (gameID) => {
    // Only return teams in game
    return global_teams.filter((team) => team.gameID === gameID);
}

const updateTeamState = (update) => {
    global_teams = global_teams.map((team) => {
        if (team.id === update.id) {
            // remove uneeded data
            const { players, player_index, ...rest } = update;
            return rest;
        } else {
            return team;
        }
    });
}

// Get Chat
const getChat = (player) => {
    // Only return chat with matching team id
    let rc = global_messages.filter((chat) => chat.teamID === player.teamID);
    if (rc === undefined || rc.length !== 1) {
        return [];
    }
    return rc[0];
}

// Game State Machine
const updateScore = (s, gameID, state) => {
    // give point based on state
    // give point to team with turn if GUESS else STEAL
    let point = (state === enums.GameState.GUESS);
    // get only teams in game
    let game = getGame(gameID);
    let teams = game.teamsCache;
    // update score
    game.teamsCache = teams.map((team) => {
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
    let game = getGame(gameID);
    switch (state) {
        case enums.GameState.SETUP:
            // TO DO: Should probably validate game
            // Send started to all
            startGame(s, gameID);
            // Cache all teams in game
            let teamsCache = getTeams(gameID);
            // Store players on teams
            teamsCache = teamsCache.map((team) => {
                let players = getPlayersOnTeam(team.id);
                return { ...team, players: players, player_index: 0 };
            });
            game.teamsCache = teamsCache;
            // Set first turn
            incrementGameState(s, gameID);
            break;
        case enums.GameState.ENTRY:
            game.answer = args;
            updateState(s, gameID, enums.GameState.HINT);
            break;
        case enums.GameState.HINT:
            updateState(s, gameID, enums.GameState.STEAL);
            break;
        case enums.GameState.STEAL:
            if (args === true) {
                updateScore(s, gameID, state);
            } else {
                updateState(s, gameID, enums.GameState.GUESS);
            }
            break;
        case enums.GameState.GUESS:
            if (args === true) {
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
    }
}

// Execute code
setInterval(garbageCollection, timeout);

// Socket functions
const updatePlayers = (s, gameID) => {
    s.in(gameID).emit('update players', getPlayersInGame(gameID));
}

const updateTeams = (s, gameID) => {
    s.in(gameID).emit('update teams', getTeams(gameID));
}

const addTeam = (s, gameID, team) => {
    // need to tell everyone changes in teams
    s.in(gameID).emit('add team', team);
}

const deleteTeam = (s, gameID, id) => {
    // need to tell everyone changes in teams
    s.in(gameID).emit('delete team', id);
}

const startGame = (s, gameID) => {
    s.in(gameID).emit('start game', enums.GameState.ENTRY);
}

const updateChat = (s, teamID, player) => {
    // should only go to members of team
    s.in(teamID).emit('team chat', getChat(player));
}

const revealAnswer = (s, gameID) => {
    let game = getGame(gameID);
    s.in(gameID).emit('reveal answer', game.answer);
    updateState(s, gameID, enums.GameState.REVEAL);
}

const updateState = (s, gameID, state) => {
    s.in(gameID).emit('set state', state);
}

const incrementGameState = (s, gameID) => {
    let gameState = getGame(gameID);
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
        if (global_players.find((player) => (name === player.name) && (gameID === player.gameID)) !== undefined) {
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
        global_players.push(player);
        s.emit('update player', player);
        updatePlayers(socket, gameID);
    });
    s.on('next state', ({ state, args }) => {
        gameStateMachine(socket, gameID, state, args);
    });
    s.on('join team', ({ teamID }) => {
        let player = getPlayer(s.id);
        if (player === undefined) {
            s.emit('exception', 'Player is not registered');
        } else {
            // change team
            s.leave(player.teamID);
            s.join(teamID);
            player.teamID = teamID;
            global_players = global_players.map((u) => {
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
        if (global_teams.find((team) => (name === team.name) && (gameID == team.gameID)) !== undefined) {
            s.emit('exception', 'Team name is taken!');
            return;
        }
        if (global_teams.find((team) => (color === team.color) && (gameID == team.gameID)) !== undefined) {
            s.emit('exception', 'Color is taken!');
            return;
        }
        // Create Team
        team = {
            id: generateTeamID(),
            name: name,
            color: color,
            score: 0,
            gameID: gameID,
            turn: false,
            data: []
        }
        global_teams.push(team);
        addTeam(socket, gameID, team);
    });
    s.on('delete team', ({ id }) => {
        global_teams = global_teams.filter((team) => {
            return (id !== team.id);
        });
        deleteTeam(socket, gameID, id);
    });
    s.on('team chat', ({ id, message }) => {
        let player = getPlayer(s.id);
        if (player === undefined || player.teamID !== id) {
            s.emit('exception', 'Not allowed to talk to another team.');
        } else {
            let = chat_entry = { player: player, message: message };
            let chat = global_messages.find((chat) => chat.teamID === id);
            if (chat === undefined) {
                // Create new entry
                chat = {
                    teamID: id,
                    data: [chat_entry]
                }
                global_messages.push(chat);
            } else {
                chat.data.push(chat_entry);
            }
            updateChat(socket, id, player);
        }
    });
    s.on('disconnect', () => {
        // Delete player
        global_players = global_players.filter((player) => player.id !== s.id);
        updatePlayers(socket, gameID);
    });
});

server.listen(3000);