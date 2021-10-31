import { gameControllerFactory, globalGames } from './stateManager';
import { GameController } from './gameController';
import logger from './logger';
import { Player, Team, Game, ChatEntry } from './structs';
import { Server, Socket } from 'socket.io';
import { generateTeamID } from './codes';
import { findByFilter, getByID, getPlayer, getPlayers } from './filters';
import { addTeam, deleteTeam, sendError, updateChat, updatePlayer, updatePlayers, updateTeams } from './emitter';

function updatePlayerClient(io: Server, socket: Socket, game: Game, player: Player): null {
    if (player === undefined) {
        console.error("Undefined player");
        return;
    }
    const oldSocketID = player.id;
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
        socket.join(player.teamID.toString());
        const team = getByID(game.teams, player.teamID);
        // Send chat data
        updateChat(io, team);
    } else {
        game.players.set(socket.id, player);
        if (oldSocketID !== socket.id) {
            game.players.delete(oldSocketID);
        }
    }

    // Update client
    updatePlayer(socket, player);
    updatePlayers(io, game);
}

export function createSocket(server) {
    const io: Server = new Server(server);
    io.on('connection', (socket: Socket) => {
        const gameID: string | string[] = socket.handshake.query.gameID;
        logger.info(socket.id + ": Connected to Game: " + gameID);
        console.log(socket.id + ": Connected to Game: " + gameID);
        const game: Game = globalGames.get(gameID.toString());
        if (game !== undefined) {
            // Register controller
            const controller: GameController = game.controller;
            socket.on('add player', ({ name, id }) => {
                console.log(gameID + " Add Player: " + name + "[" + id + "]");
                socket.join(gameID);
                // Check if player is cached
                let player: Player = getPlayer(game, id);
                if (controller.isGameStarted(game)) {
                    if (player === undefined) {
                        // Can't find by id so search by name in cached players
                        for (let i: number = 0; i < game.cachedPlayers.length; i++) {
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
                if (player === undefined && !controller.isGameStarted(game)) {
                    // Check if player name exists
                    let players: Array<Player> = getPlayers(game);
                    if (findByFilter(players, (player: Player) => (name === player.name))) {
                        sendError(socket, 'Name is taken!');
                    } else {
                        // Create Player
                        console.log('Create Player: ' + name);
                        player = controller.createPlayer(socket.id, name);
                    }
                }
                if (player !== undefined) {
                    updatePlayerClient(io, socket, game, player);
                } else {
                    sendError(socket, "Cannot currently join game!");
                }
            });
            socket.on('change role', ({ type }) => {
                // Update player in game
                const player: Player = game.players.get(socket.id);
                if (player === undefined) {
                    // Could not find player
                    console.error('Player not found: ' + socket.id);
                    return;
                }
                player.type = type;
                updatePlayer(socket, player);
                updatePlayers(io, game);
            });
            socket.on('next state', ({ state, args }) => {
                controller.gameStateMachine(io, socket, game, state, args);
            });
            socket.on('join team', (teamID: number) => {
                let player: Player = getPlayer(game, socket.id);
                if (player === undefined) {
                    console.log("Unregistered Player")
                    sendError(socket, 'Player is not registered');
                } else {
                    // check if unassigned
                    if (player.teamID === -1) {
                        game.players.delete(player.id);
                    } else {
                        // remove from team
                        socket.leave(player.teamID.toString());
                        let team: Team = getByID(game.teams, player.teamID);
                        team.players = team.players.filter((p) => p.id !== player.id);
                    }
                    // add to team
                    socket.join(teamID.toString());
                    player.teamID = teamID;
                    let team: Team = getByID(game.teams, teamID);
                    if (team === undefined) {
                        console.log("Team not found")
                        sendError(socket, 'Team not found');
                    } else {
                        team.players.push(player);
                        updatePlayer(socket, player);
                        updateTeams(io, game);
                        updatePlayers(io, game);
                        updateChat(io, team);
                    }
                }
            });
            socket.on('add team', ({ name, color }) => {
                // Check if team name and color exist
                if (game.teams.find((team) => (name === team.name)) !== undefined) {
                    sendError(socket, 'Team name is taken!');
                    return;
                }
                if (game.teams.find((team) => (color === team.color)) !== undefined) {
                    sendError(socket, 'Color is taken!');
                    return;
                }
                // Create Team
                const team = new Team(generateTeamID(game.teams), name, color);
                game.teams.push(team);
                addTeam(io, game.id, team);
            });
            socket.on('delete team', ({ id }) => {
                game.teams = game.teams.filter((team) => (id !== team.id));
                deleteTeam(io, game.id, id);
            });
            socket.on('team chat', ({ teamID, message }) => {
                const player: Player = getPlayer(game, socket.id);
                if (player === undefined || player.teamID !== teamID) {
                    sendError(socket, 'Not allowed to talk to another team.');
                } else {
                    // Get Team
                    const team: Team = getByID(game.teams, teamID);
                    const chatEntry: ChatEntry = new ChatEntry(player.name, message);
                    team.chat.push(chatEntry);
                    updateChat(io, team);
                }
            });
            socket.on('upload data', (data) => {
                if (!controller.loadData(io, game.id, data)) {
                    sendError(socket, "Failed to load data!");
                }
            });
            socket.on('disconnect', (reason) => {
                const player: Player = getPlayer(game, socket.id);
                console.log("Disconnecting due to " + reason + ": " + socket.id + " - " + ((player !== undefined) && player.name));

                if ((game !== undefined) && !controller.isGameStarted(game)) {
                    console.log("Delete Player: " + socket.id + " - " + ((player !== undefined) && player.name));
                    // Delete player
                    game.players.delete(socket.id);
                    // Remove from teams
                    game.teams = game.teams.map((team) => {
                        return { ...team, players: team.players.filter((player) => player.id !== socket.id) };
                    })
                    updatePlayers(io, game);
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