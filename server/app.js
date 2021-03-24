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
let playerCache = {};
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
    const gameID = req.query.gameID;
    const game = filters.getByID(globalGames, gameID);
    const players = getPlayers(game);
    const data = {
        players: players
    };

    res.json(data);
})

app.get('/teams', function (req, res) {
    let gameID = req.query.gameID;
    // retrieve game and return its teams
    let game = filters.getByID(globalGames, gameID);
    let data = {
        teams: game.teams
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
            teams: [],
            players: [],
            answer: ""
        }
        globalGames.push(game);
    }
}

// Garbage collection
const garbageCollection = () => {
    // remove any inactive game ids
    globalGames = globalGames.filter((game) => {
        return (getPlayers(game).length === 0);
    });
}

// Read/Write Game State
const getCurrentPlayer = (teams, gameState) => {
    // Get player
    let playerIndex = teams[gameState.teamIndex].playerIndex;
    let player = teams[gameState.teamIndex].players[playerIndex];
    return player;
}

const getCurrentTeam = (teams, gameState) => {
    let team = teams[gameState.teamIndex];
    return team;
}

const incrementTeamIndex = (teams, gameState) => {
    gameState.teamIndex++;
    // Check if valid
    if (gameState.teamIndex >= teams.length) {
        gameState.teamIndex = 0;
    }
}

const incrementPlayerIndex = (teams, gameState) => {
    teams[gameState.teamIndex].playerIndex++;
    // Check if valid
    if (teams[gameState.teamIndex].playerIndex >= teams[gameState.teamIndex].players.length) {
        teams[gameState.teamIndex].playerIndex = 0;
    }
}

const changeTeamTurns = (teams, gameState) => {
    // Set old team to false
    let team = getCurrentTeam(teams, gameState);
    team.turn = false;

    // Increment
    incrementTeamIndex(teams, gameState);
    // Set new team to true
    team = getCurrentTeam(teams, gameState);
    team.turn = true;
}

const changePlayerTurns = (teams, gameState) => {
    // Set old player to false
    let player = getCurrentPlayer(teams, gameState);
    player.turn = false;

    // Change teams
    changeTeamTurns(teams, gameState);
    // Set new player to true
    incrementPlayerIndex(teams, gameState);
    player = getCurrentPlayer(teams, gameState);
    player.turn = true;
}

const resetGameState = (s, game) => {
    game.teams = game.teams.map((team) => {
        return {
            ...team, score: 0, turn: false, players: team.players.map((player) => {
                return { ...player, turn: false }
            })
        };
    });

    updateTeams(s, game);
    updatePlayers(s, game);
}
// Get Players
const getPlayers = (game) => {
    let players = game.players
    // iterate through teams in game
    if (game.teams.length !== 0) {
        players = players.concat(game.teams.reduce((pre, next) => {
            return { players: pre.players.concat(next.players) }
        }).players);
    }
    return players;
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
const updateScore = (s, game, state) => {
    // give point based on state
    // give point to team with turn if GUESS else STEAL
    let point = (state === enums.GameState.GUESS);
    // update score
    game.teams = game.teams.map((team) => {
        if (team.turn === point) {
            return { ...team, score: team.score + 1 }
        } else {
            return team;
        }
    });
    // change turns
    incrementGameState(s, game);
    // back to beginning
    revealAnswer(s, game);
}

const gameStateMachine = (s, game, state, args) => {
    switch (state) {
        case enums.GameState.SETUP:
            // TO DO: Should probably validate game
            // Send started to all
            setStarted(s, game.id, true);
            // Set first turn
            incrementGameState(s, game);
            updateState(s, game.id, enums.GameState.ENTRY);
            break;
        case enums.GameState.ENTRY:
            game.answer = args.answer;
            updateState(s, game.id, enums.GameState.HINT);
            break;
        case enums.GameState.HINT:
            updateState(s, game.id, enums.GameState.STEAL);
            break;
        case enums.GameState.STEAL:
            if (args.correct === true) {
                updateScore(s, game, state);
            } else {
                updateState(s, game.id, enums.GameState.GUESS);
            }
            break;
        case enums.GameState.GUESS:
            if (args.correct === true) {
                updateScore(s, game, state);
            } else {
                // change turns
                incrementGameState(s, game);
                // back to beginning
                revealAnswer(s, game);
            }
            break;
        case enums.GameState.REVEAL:
            updateState(s, game.id, enums.GameState.ENTRY);
            break;
        case enums.GameState.END:
            // Reset to beginning
            setStarted(s, game.id, false);
            // Set winner
            setWinner(s, game);
            // Reset game
            resetGameState(s, game);
            updateState(s, game.id, enums.GameState.SETUP);
            break;
    }
}

// Execute code
setInterval(garbageCollection, timeout);

// Socket functions
const updatePlayers = (s, game) => {
    s.in(game.id).emit('update players', getPlayers(game));
}

const updateTeams = (s, game) => {
    s.in(game.id).emit('update teams', game.teams);
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

const revealAnswer = (s, game) => {
    s.in(game.id).emit('reveal answer', game.answer);
    updateState(s, game.id, enums.GameState.REVEAL);
}

const updateState = (s, gameID, state) => {
    s.in(gameID).emit('set state', state);
}

const setWinner = (s, game) => {
    // Get winner
    let winner = game.teams.reduce((pre, next) => {
        return pre.score > next.score ? pre : next;
    });
    // There might have been more than one team with the same score
    const tie = game.teams.filter((team) => team.score === winner.score);
    if (tie.length > 1) {
        winner = undefined;
    }
    s.in(game.id).emit('set winner', winner);
}

const incrementGameState = (s, game) => {
    let teams = game.teams;
    // Move the turn along
    changePlayerTurns(teams, game);
    // Update sockets
    updatePlayers(s, game);
    updateTeams(s, game);
}

const server = http.createServer(app);
const socket = io(server);
socket.on('connection', (s) => {
    const gameID = s.handshake.query['gameID'];
    const game = filters.getByID(globalGames, gameID);
    s.on('add player', ({ name }) => {
        s.join(gameID);
        // Check if team name and color exist
        let players = getPlayers(game);
        if (players.find((player) => (name === player.name) && (gameID === player.gameID)) !== undefined) {
            s.emit('exception', 'Name is taken!');
            return;
        }
        // Create Player
        player = {
            id: s.id,
            name: name,
            turn: false,
            teamID: -1
        }
        game.players.push(player);
        s.emit('update player', player);
        updatePlayers(socket, game);
    });
    s.on('next state', ({ state, args }) => {
        gameStateMachine(socket, game, state, args);
    });
    s.on('join team', ({ teamID }) => {
        let player = filters.getByID(getPlayers(game), s.id);
        if (player === undefined) {
            s.emit('exception', 'Player is not registered');
        } else {
            // check if unassigned
            if (player.teamID === -1) {
                game.players = game.players.filter((p) => p.id !== player.id);

            } else {
                // remove from team
                s.leave(player.teamID);
                let team = filters.getByID(game.teams, player.teamID);
                team.players = team.players.filter((p) => p.id !== player.id);
            }
            // add to team
            s.join(teamID);
            player.teamID = teamID;
            team = filters.getByID(game.teams, teamID);
            team.players.push(player);

            s.emit('update player', player);
            updateTeams(socket, game);
            updatePlayers(socket, game);
            updateChat(socket, teamID, player);
        }
    });
    s.on('add team', ({ name, color }) => {
        // Check if team name and color exist
        if (game.teams.find((team) => (name === team.name)) !== undefined) {
            s.emit('exception', 'Team name is taken!');
            return;
        }
        if (game.teams.find((team) => (color === team.color)) !== undefined) {
            s.emit('exception', 'Color is taken!');
            return;
        }
        // Create Team
        team = {
            id: codes.generateTeamID(game.teams),
            name: name,
            color: color,
            score: 0,
            turn: false,
            players: [],
            playerIndex: 0
        }
        game.teams.push(team);
        addTeam(socket, game.id, team);
    });
    s.on('delete team', ({ id }) => {
        game.teams = game.teams.filter((team) => {
            return (id !== team.id);
        });
        deleteTeam(socket, game.id, id);
    });
    s.on('team chat', ({ id, message }) => {
        let player = filters.getByID(getPlayers(game), s.id);
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
        if (game !== undefined) {
            // Delete player
            game.players = game.players.filter((player) => player.id !== s.id);
            game.teams = game.teams.map((team) => {
                return { ...team, players: team.players.filter((player) => player.id !== s.id) };
            })
            updatePlayers(socket, game);
        }
    });
});

server.listen(3000);