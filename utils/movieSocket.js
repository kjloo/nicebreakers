const io = require('socket.io');
const filters = require('./filters');
const codes = require('./codes');
const movieState = require('./movieState');
const movieEmitter = require('./movieEmitter');

const createSocket = (server) => {
    const socket = io(server);
    socket.on('connection', (s) => {
        const gameID = s.handshake.query['gameID'];
        const game = filters.getByID(movieState.globalGames, gameID);
        if (game !== undefined) {
            s.on('add player', ({ name }) => {
                s.join(gameID);
                // Check if team name and color exist
                let players = filters.getPlayers(game);
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
                movieEmitter.updatePlayers(socket, game);
            });
            s.on('next state', ({ state, args }) => {
                movieState.gameStateMachine(socket, game, state, args);
            });
            s.on('join team', ({ teamID }) => {
                let player = filters.getByID(filters.getPlayers(game), s.id);
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
                    movieEmitter.updateTeams(socket, game);
                    movieEmitter.updatePlayers(socket, game);
                    movieEmitter.updateChat(socket, player.teamID, movieState.getChat(player));
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
                movieEmitter.addTeam(socket, game.id, team);
            });
            s.on('delete team', ({ id }) => {
                game.teams = game.teams.filter((team) => {
                    return (id !== team.id);
                });
                movieEmitter.deleteTeam(socket, game.id, id);
            });
            s.on('team chat', ({ id, message }) => {
                let player = filters.getByID(filters.getPlayers(game), s.id);
                if (player === undefined || player.teamID !== id) {
                    s.emit('exception', 'Not allowed to talk to another team.');
                } else {
                    const chatEntry = { player: player, message: message };
                    let chat = movieState.globalMessages.find((chat) => chat.teamID === id);
                    if (chat === undefined) {
                        // Create new entry
                        chat = {
                            teamID: id,
                            data: [chatEntry]
                        }
                        movieState.globalMessages.push(chat);
                    } else {
                        chat.data.push(chatEntry);
                    }
                    movieEmitter.updateChat(socket, id, movieState.getChat(player));
                }
            });
            s.on('disconnect', () => {
                if (game !== undefined) {
                    // Delete player
                    game.players = game.players.filter((player) => player.id !== s.id);
                    // Remove from teams
                    game.teams = game.teams.map((team) => {
                        return { ...team, players: team.players.filter((player) => player.id !== s.id) };
                    })
                    movieEmitter.updatePlayers(socket, game);
                }
            });
        } else {
            console.error("Could not get gameID!");
        }
    });
};

module.exports = {
    createSocket: createSocket
}