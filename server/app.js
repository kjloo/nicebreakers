const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const io = require('socket.io');

// consts
const codeLength = 4;
const timeout = 60000; // 60 sec

// In memory data
let games = [];
let users = [];
let teams = [];

// Middleware
app.use(express.static(path.join(__dirname, 'build')));

// API requests
app.get('/users', function (req, res) {
    res.json(getUsers());
})

app.get('/teams', function (req, res) {
    res.json(getTeams());
})

app.get('/movie/game', function (req, res) {
    let code = generateGameCode();
    res.redirect(`/movie/game/${code}`);
});

app.get('/movie/game/:gameID', function (req, res, next) {
    gameID = req.params.gameID;
    if (gameID.length !== codeLength) {
        res.send("Invalid GameID");
    }
    else if (!games.includes(gameID)) {
        games.push(gameID);
    }
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

// Garbage collection
const garbageCollection = () => {
    // remove any inactive game ids
    games = games.filter((game) => {
        return (users.find((user) => user.gameID === game) !== undefined);
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
    while (games.includes(code)) {
        code = generateCode();
    }
    return code;
}

// Create Team ID
const generateTeamID = () => {
    // This should be fine as incrementing should yield a new number
    let teamID = 0;
    while (teams.find((team) => team.id === teamID) !== undefined) {
        teamID = Date.now();
    }
    return teamID;
}

// Get Users
const getUsers = () => {
    data = {
        users: users
    }
    return data
}

// Get Teams
const getTeams = () => {
    data = {
        teams: teams
    }
    return data
}

// Execute code
setInterval(garbageCollection, timeout);

const server = http.createServer(app);
const socket = io(server);
socket.on('connection', (s) => {
    const gameID = s.handshake;
    console.log(gameID);
    s.on('add user', ({ name }) => {
        // Check if team name and color exist
        if (users.find((user) => name === user.name) !== undefined) {
            s.emit('exception', 'Name is taken!');
            return;
        }
        // Create Team
        user = {
            id: s.id,
            name: name,
            teamID: -1
        }
        users.push(user);
        s.emit('registered user', user);
        socket.emit('update users', users);
    });
    s.on('update user', ({ user }) => {
        users = users.map((u) => {
            // If match return new user else keep old data
            return u.id === s.id ? user : u;
        });
        socket.emit('update users', users);
    });
    s.on('add team', ({ name, color }) => {
        // Check if team name and color exist
        if (teams.find((team) => name === team.name) !== undefined) {
            s.emit('exception', 'Team name is taken!');
            return;
        }
        if (teams.find((team) => color === team.color) !== undefined) {
            s.emit('exception', 'Color is taken!');
            return;
        }
        // Create Team
        team = {
            id: generateTeamID(),
            name: name,
            color: color,
            score: 0,
            data: []
        }
        teams.push(team);
        socket.emit('update teams', teams);
    });
    s.on('delete team', ({ id }) => {
        teams = teams.filter((team) => {
            return (id !== team.id);
        });
        socket.emit('update teams', teams);
    });
    s.on('team chat', ({ id, message }) => {
        teams = teams.map((team) => {
            return (id === team.id) ? { ...team, data: [...team.data, message] } : team;
        });
        socket.emit('team chat', teams);
    });
    s.on('disconnect', (s) => {
        // Delete user
        users = users.filter((user) => user.id !== s.id);
        socket.emit('update users', users);
    });
});

server.listen(3000);