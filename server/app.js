const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const io = require('socket.io');

let users = [];
let teams = [];

// Middleware
app.use(express.static(path.join(__dirname, 'build')));

// Routes
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

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
    return users
}

// Get Teams
const getTeams = () => {
    data = {
        teams: teams
    }
    return data
}

app.get('/users', function (req, res) {
    res.json(getUsers());
})

app.get('/teams', function (req, res) {
    res.json(getTeams());
})

const server = http.createServer(app);
const socket = io(server);
socket.on('connection', (s) => {
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