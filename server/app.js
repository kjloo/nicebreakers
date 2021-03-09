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
    else if (!global_games.includes(gameID)) {
        global_games.push(gameID);
    }
}

// Garbage collection
const garbageCollection = () => {
    // remove any inactive game ids
    global_games = global_games.filter((game) => {
        return (global_players.find((player) => player.gameID === game) !== undefined);
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
    while (global_games.includes(code)) {
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
const getCurrentPlayer = (team_cache, game_state) => {
    // Get player
    let player_index = team_cache[game_state.team_index].player_index;
    let player = team_cache[game_state.team_index].players[player_index];
    return player;
}

const getCurrentTeam = (team_cache, game_state) => {
    let team = team_cache[game_state.team_index];
    return team;
}

const incrementTeamIndex = (team_cache, game_state) => {
    game_state.team_index++;
    // Check if valid
    if (game_state.team_index >= team_cache.length) {
        game_state.team_index = 0;
    }
}

const incrementPlayerIndex = (team_cache, game_state) => {
    team_cache[game_state.team_index].player_index++;
    // Check if valid
    if (team_cache[game_state.team_index].player_index >= team_cache[game_state.team_index].players.length) {
        team_cache[game_state.team_index].player_index = 0;
    }
}

const changeTeamTurns = (team_cache, game_state) => {
    // Set old team to false
    let team = getCurrentTeam(team_cache, game_state);
    team.turn = false;
    updateTeamState(team);

    // Increment
    incrementTeamIndex(team_cache, game_state);
    // Set new team to true
    team = getCurrentTeam(team_cache, game_state);
    team.turn = true;

    // Update global teams list
    updateTeamState(team);
}

const changePlayerTurns = (team_cache, game_state) => {
    // Set old player to false
    let player = getCurrentPlayer(team_cache, game_state);
    player.turn = false;

    // Update global players list
    updatePlayerState(player);

    // Change teams
    changeTeamTurns(team_cache, game_state);
    // Set new player to true
    incrementPlayerIndex(team_cache, game_state);
    player = getCurrentPlayer(team_cache, game_state);
    player.turn = true;

    // Update global players list
    updatePlayerState(player);
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

const updateState = (s, gameID, state) => {
    s.in(gameID).emit('set state', state);
}

const incrementGameState = (s, gameID, team_cache, game_state) => {
    // Move the turn along
    changePlayerTurns(team_cache, game_state);
    // Update sockets
    updatePlayers(s, gameID);
    updateTeams(s, gameID);
}

const server = http.createServer(app);
const socket = io(server);
socket.on('connection', (s) => {
    const gameID = s.handshake.query['gameID'];
    // Use to store game state
    let team_cache = [];
    let game_state = {
        team_index: 0,
        movie: ""
    };
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
    s.on('alert stop', () => {
        updateState(socket, gameID, enums.GameState.GUESS);
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
    s.on('update score', ({ teamID, score }) => {
        teams.map((team) => {
            if (team.id === teamID) {
                return { ...team, score: score };
            }
            return team;
        });
        updateTeams(s, gameID);
    });
    s.on('start game', () => {
        // TO DO: Should probably validate game
        // Send started to all
        startGame(socket, gameID);
        // Cache all teams in game
        team_cache = getTeams(gameID);
        // Store players on teams
        team_cache = team_cache.map((team) => {
            let players = getPlayersOnTeam(team.id);
            return { ...team, players: players, player_index: 0 };
        });
        // Set first turn
        incrementGameState(socket, gameID, team_cache, game_state);
        updatePlayers(socket, gameID);
    });
    s.on('set movie', ({ movie }) => {
        game_state.movie = movie;
        updateState(socket, gameID, enums.GameState.HINT);
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