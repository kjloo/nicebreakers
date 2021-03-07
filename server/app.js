const express = require('express');
const acronym = require('./utils/acronym.js');
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
    players = getPlayers(gameID);
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

// Get Player
const getPlayer = (playerID) => {
    return global_players.find((player) => player.id === playerID);
}

// Get Players
const getPlayers = (gameID) => {
    return global_players.filter((player) => player.gameID === gameID);
}

// Get Teams
const getTeams = (gameID, playerID = undefined) => {
    let rc = global_teams.filter((team) => team.gameID === gameID);
    let player = (playerID === undefined) ? undefined : getPlayer(playerID);
    rc = rc.map((team) => {
        if ((player === undefined) || (team.id !== player.teamID)) {
            // delete messages
            return { ...team, data: [] };
        }
        return team;
    });
    return rc;
}

// Execute code
setInterval(garbageCollection, timeout);

// Socket functions
const updatePlayers = (s, gameID) => {
    s.in(gameID).emit('update players', getPlayers(gameID));
}

const addTeam = (s, gameID, team) => {
    // need to tell everyone changes in teams
    s.in(gameID).emit('add team', team);
}

const deleteTeam = (s, gameID, id) => {
    // need to tell everyone changes in teams
    s.in(gameID).emit('delete team', id);
}

const updateTeam = (s, teamID, playerID) => {
    // should only go to members of team
    s.in(teamID).emit('team chat', getTeams(gameID, playerID));
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
        // Create Team
        player = {
            id: s.id,
            name: name,
            gameID: gameID,
            teamID: -1
        }
        global_players.push(player);
        s.emit('update player', player);
        updatePlayers(socket, gameID);
    });
    s.on('join team', ({ teamID }) => {
        let player = getPlayer(s.id);
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
        updateTeam(socket, teamID, s.id);
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
    });
    s.on('team chat', ({ id, message }) => {
        let player = getPlayer(s.id);
        if (player.teamID !== id) {
            s.emit('exception', 'Not allowed to talk to another team.');
        } else {
            global_teams = global_teams.map((team) => {
                return (id === team.id) ? { ...team, data: [...team.data, { player: player, message: message }] } : team;
            });
            updateTeam(socket, id, s.id);
        }
    });
    s.on('disconnect', () => {
        // Delete player
        global_players = global_players.filter((player) => player.id !== s.id);
        updatePlayers(socket, gameID);
    });
});

server.listen(3000);