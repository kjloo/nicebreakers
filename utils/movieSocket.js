const { Server } = require('socket.io');
const filters = require('./filters');
const codes = require('./codes');
const movieState = require('./movieState');
const movieEmitter = require('./movieEmitter');
const structs = require('./structs');

const updatePlayerClient = (io, socket, game, player) => {
    if (player === undefined) {
        console.error("Undefined player");
        return;
    }
    player.id = socket.id;

    if (player.teamID !== -1) {
        console.log('Player is on team ' + player.teamID);
        // Update player object in teams
        game.teams = game.teams.map((team) => {
            if (team.id === player.teamID) {
                team.players = team.players.map((p) => {
                    if (p.name === player.name) {
                        return player;
                    } else {
                        return p;
                    }
                });
                return team;
            } else {
                return team;
            }
        });

        // Join team
        socket.join(player.teamID);
        const team = filters.getByID(game.teams, player.teamID);
        // Send chat data
        movieEmitter.updateChat(socket, team);
    } else {
        game.players.set(socket.id, player);
    }

    // Update client
    console.log('Update player ' + player.name + ' on ' + socket.id);
    socket.emit('update player', player);
    movieEmitter.updatePlayers(io, game);
}

const createSocket = (server) => {
    const io = new Server(server);
    io.on('connection', (socket) => {
        const gameID = socket.handshake.query.gameID;
        console.log(socket.id + ": Connected to Game: " + gameID);
        const game = movieState.globalGames.get(gameID);
        if (game !== undefined) {
            socket.on('add player', ({ name, id }) => {
                console.log(gameID + " Add Player: " + name + "[" + id + "]");
                socket.join(gameID);
                // Check if player is cached
                let player = filters.getPlayer(game, id);
                if (movieState.isGameStarted(game)) {
                    if (player === undefined) {
                        // Can't find by id so search by name in cached players
                        for (i = 0; i < game.cachedPlayers.length; i++) {
                            if (game.cachedPlayers[i] === undefined) {
                                console.log("Error getting cached player")
                                console.log(game);
                                continue;
                            }
                            if (game.cachedPlayers[i].name === name) {
                                console.log("Found Cached Player: " + name);
                                player = game.cachedPlayers[i];
                                game.cachedPlayers.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
                // Create player if not found
                if (player === undefined) {
                    // Check if player name exists
                    let players = filters.getPlayers(game);
                    if (filters.findByFilter(players, (player) => (name === player.name))) {
                        movieEmitter.sendError(socket, 'Name is taken!');
                    } else {
                        // Create Player
                        console.log('Create Player: ' + name);
                        player = new structs.Player(socket.id, name, false, -1);
                    }
                }
                updatePlayerClient(io, socket, game, player);
            });
            socket.on('next state', ({ state, args }) => {
                movieState.gameStateMachine(io, game, state, args);
            });
            socket.on('join team', ({ teamID }) => {
                let player = filters.getPlayer(game, socket.id);
                if (player === undefined) {
                    console.log("Unregistered Player")
                    movieEmitter.sendError(socket, 'Player is not registered');
                } else {
                    // check if unassigned
                    if (player.teamID === -1) {
                        game.players.delete(player.id);
                    } else {
                        // remove from team
                        socket.leave(player.teamID);
                        let team = filters.getByID(game.teams, player.teamID);
                        team.players = team.players.filter((p) => p.id !== player.id);
                    }
                    // add to team
                    socket.join(teamID);
                    player.teamID = teamID;
                    team = filters.getByID(game.teams, teamID);
                    if (team === undefined) {
                        console.log("Team not found")
                        movieEmitter.sendError(socket, 'Team not found');
                    } else {
                        team.players.push(player);

                        socket.emit('update player', player);
                        movieEmitter.updateTeams(io, game);
                        movieEmitter.updatePlayers(io, game);
                        movieEmitter.updateChat(io, team);
                    }
                }
            });
            socket.on('add team', ({ name, color }) => {
                // Check if team name and color exist
                if (game.teams.find((team) => (name === team.name)) !== undefined) {
                    movieEmitter.sendError(socket, 'Team name is taken!');
                    return;
                }
                if (game.teams.find((team) => (color === team.color)) !== undefined) {
                    movieEmitter.sendError(socket, 'Color is taken!');
                    return;
                }
                // Create Team
                const team = new structs.Team(codes.generateTeamID(game.teams), name, color, 0, false, [], [], 0);
                game.teams.push(team);
                movieEmitter.addTeam(io, game.id, team);
            });
            socket.on('delete team', ({ id }) => {
                game.teams = game.teams.filter((team) => (id !== team.id));
                movieEmitter.deleteTeam(io, game.id, id);
            });
            socket.on('team chat', ({ teamID, message }) => {
                const player = filters.getPlayer(game, socket.id);
                if (player === undefined || player.teamID !== teamID) {
                    movieEmitter.sendError(socket, 'Not allowed to talk to another team.');
                } else {
                    // Get Team
                    const team = filters.getByID(game.teams, teamID);
                    const chatEntry = new structs.ChatEntry(player.name, message);
                    team.chat.push(chatEntry);
                    movieEmitter.updateChat(io, team);
                }
            });
            socket.on('disconnect', (reason) => {
                const player = filters.getPlayer(game, socket.id);
                console.log("Disconnecting due to " + reason + ": " + socket.id + " - " + ((player !== undefined) && player.name));

                if ((game !== undefined) && !movieState.isGameStarted(game)) {
                    console.log("Delete Player: " + socket.id + " - " + ((player !== undefined) && player.name));
                    // Delete player
                    game.players.delete(socket.id);
                    // Remove from teams
                    game.teams = game.teams.map((team) => {
                        return { ...team, players: team.players.filter((player) => player.id !== socket.id) };
                    })
                    movieEmitter.updatePlayers(io, game);
                } else {
                    if (player !== undefined) {
                        // Store disconnected player
                        console.log('Store ' + player.name);
                        game.cachedPlayers.push(player);
                    }
                }
            });
            socket.on('reconnect', () => {
                console.log("Attempting to reconnect to io: " + socket.id);
            });
        } else {
            console.error("Game " + gameID + " does not exist!");
        }
    });
};

module.exports = {
    createSocket: createSocket
}