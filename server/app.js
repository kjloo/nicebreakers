const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const io = require('socket.io');

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
    // Need to reclaim lost IDs though.
    let teamID = 0;
    while (teams.find((team) => team.id === teamID) !== undefined) {
        teamID = Date.now();
    }
    return teamID;
}

// Get Teams
const getTeams = () => {
    data = {
        teams: teams
    }
    return data
}
app.get('/teams', function (req, res) {
    res.json(getTeams());
})

// app.post('/count', function (req, res) {
//     count++;
//     res.json(getCount());
// })

const server = http.createServer(app);
const socket = io(server);
socket.on('connection', (s) => {
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
    s.on('disconnect', () => {
    });
});

server.listen(3000);