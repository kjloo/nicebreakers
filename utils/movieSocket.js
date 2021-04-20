const io = require('socket.io');
const filters = require('./filters');
const codes = require('./codes');
const movieState = require('./movieState');
const movieEmitter = require('./movieEmitter');
const structs = require('./structs');

const createSocket = (server) => {
    const socket = io(server);
    socket.on('connection', (s) => {
        const gameID = s.handshake.query['gameID'];
        console.log(s.id + ": Connected to Game: " + gameID);
        const game = movieState.globalGames.get(gameID);
        if (game !== undefined) {
            s.on('add player', ({ name }) => {
                console.log("Add Player: " + name);
                s.join(gameID);
                // Check if player is cached
                let player = undefined;
                if (movieState.isGameStarted(game)) {
                    for (i = 0; i < game.cachedPlayers.length; i++) {
                        if (game.cachedPlayers[i].name === name) {
                            console.log("Found Cached Player: " + name);
                            player = game.cachedPlayers[i];
                            player.id = s.id;
                            game.cachedPlayers.splice(i, 1);
                            break;
                        }
                    }
                }
                if (player === undefined) {
                    // Check if player name exists
                    let players = filters.getPlayers(game);
                    if (filters.findByFilter(players, (player) => (name === player.name) && (gameID === player.gameID)) !== undefined) {
                        s.emit('exception', 'Name is taken!');
                    } else {
                        // Create Player
                        player = new structs.Player(s.id, name, false, -1);
                        game.players.set(s.id, player);
                    }
                }
                s.emit('update player', player);
                movieEmitter.updatePlayers(socket, game);
            });
            s.on('next state', ({ state, args }) => {
                console.log("Game State: " + game.state);
                game.state = state;
                movieState.gameStateMachine(socket, game, state, args);
            });
            s.on('join team', ({ teamID }) => {
                let player = filters.getPlayer(game, s.id);
                if (player === undefined) {
                    console.log("Unregistered Player")
                    s.emit('exception', 'Player is not registered');
                } else {
                    // check if unassigned
                    if (player.teamID === -1) {
                        game.players.delete(player.id);
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
                    if (team === undefined) {
                        console.log("Team not found")
                        s.emit('exception', 'Team not found');
                    } else {
                        team.players.push(player);

                        s.emit('update player', player);
                        movieEmitter.updateTeams(socket, game);
                        movieEmitter.updatePlayers(socket, game);
                        movieEmitter.updateChat(socket, player.teamID, movieState.getChat(player));
                    }
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
                const team = new structs.Team(codes.generateTeamID(game.teams), name, color, 0, false, [], 0);
                game.teams.push(team);
                movieEmitter.addTeam(socket, game.id, team);
            });
            s.on('delete team', ({ id }) => {
                game.teams = game.teams.filter((team) => (id !== team.id));
                movieEmitter.deleteTeam(socket, game.id, id);
            });
            s.on('team chat', ({ id, message }) => {
                const player = filters.getPlayer(game, s.id);
                if (player === undefined || player.teamID !== id) {
                    s.emit('exception', 'Not allowed to talk to another team.');
                } else {
                    const chatEntry = new structs.ChatEntry(player, message);
                    let chat = movieState.globalMessages.find((chat) => chat.teamID === id);
                    if (chat === undefined) {
                        // Create new entry
                        chat = new structs.Chat(id, [chatEntry]);
                        movieState.globalMessages.push(chat);
                    } else {
                        chat.data.push(chatEntry);
                    }
                    movieEmitter.updateChat(socket, id, movieState.getChat(player));
                }
            });
            s.on('disconnect', (reason) => {
                const player = filters.getPlayer(game, s.id);
                console.log("Disconnecting due to " + reason + ": " + s.id + " - " + ((player !== undefined) && player.name));
                if ((game !== undefined) && !movieState.isGameStarted(game)) {
                    console.log("Delete Player: " + s.id + " - " + ((player !== undefined) && player.name));
                    // Delete player
                    game.players.delete(s.id);
                    // Remove from teams
                    game.teams = game.teams.map((team) => {
                        return { ...team, players: team.players.filter((player) => player.id !== s.id) };
                    })
                    movieEmitter.updatePlayers(socket, game);
                } else {
                    // Store disconnected player
                    game.cachedPlayers.push(player);
                }
            });
            s.on('reconnect', () => {
                console.log("Attempting to reconnect to socket: " + s.id);
            });
        } else {
            console.error("Game " + gameID + " does not exist!");
        }
    });
};

module.exports = {
    createSocket: createSocket
}