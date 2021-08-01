"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.createSocket = void 0;
var stateManager_1 = require("./stateManager");
var logger_1 = require("./logger");
var structs_1 = require("./structs");
var socket_io_1 = require("socket.io");
var codes_1 = require("./codes");
var filters_1 = require("./filters");
var emitter = require('./emitter');
function updatePlayerClient(io, socket, game, player) {
    if (player === undefined) {
        console.error("Undefined player");
        return;
    }
    player.id = socket.id;
    if (player.teamID !== -1) {
        console.log('Player is on team ' + player.teamID);
        // Update player object in teams
        game.teams = game.teams.map(function (team) {
            if (team.id === player.teamID) {
                team.players = team.players.map(function (p) {
                    if (p.name === player.name) {
                        return player;
                    }
                    else {
                        return p;
                    }
                });
                return team;
            }
            else {
                return team;
            }
        });
        // Join team
        socket.join(player.teamID.toString());
        var team = filters_1.getByID(game.teams, player.teamID);
        // Send chat data
        emitter.updateChat(socket, team);
    }
    else {
        game.players.set(socket.id, player);
    }
    // Update client
    emitter.updatePlayer(socket, player);
    emitter.updatePlayers(io, game);
}
function createSocket(server) {
    var io = new socket_io_1.Server(server);
    io.on('connection', function (socket) {
        var gameID = socket.handshake.query.gameID;
        logger_1["default"].info(socket.id + ": Connected to Game: " + gameID);
        console.log(socket.id + ": Connected to Game: " + gameID);
        var game = stateManager_1.globalGames.get(gameID);
        if (game !== undefined) {
            var controller_1 = stateManager_1.gameControllerFactory(game);
            socket.on('add player', function (_a) {
                var name = _a.name, id = _a.id;
                console.log(gameID + " Add Player: " + name + "[" + id + "]");
                socket.join(gameID);
                // Check if player is cached
                var player = filters_1.getPlayer(game, id);
                if (controller_1.isGameStarted(game)) {
                    if (player === undefined) {
                        // Can't find by id so search by name in cached players
                        for (var i = 0; i < game.cachedPlayers.length; i++) {
                            if (game.cachedPlayers[i] === undefined) {
                                console.log("Error getting cached player");
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
                    var players = filters_1.getPlayers(game);
                    if (filters_1.findByFilter(players, function (player) { return (name === player.name); })) {
                        emitter.sendError(socket, 'Name is taken!');
                    }
                    else {
                        // Create Player
                        console.log('Create Player: ' + name);
                        player = controller_1.createPlayer(socket.id, name);
                    }
                }
                updatePlayerClient(io, socket, game, player);
            });
            socket.on('change role', function (_a) {
                var type = _a.type;
                // Update player in game
                var player = game.players.get(socket.id);
                if (player === undefined) {
                    // Could not find player
                    console.error('Player not found: ' + socket.id);
                    return;
                }
                player.type = type;
                emitter.updatePlayer(socket, player);
                emitter.updatePlayers(io, game);
            });
            socket.on('next state', function (_a) {
                var state = _a.state, args = _a.args;
                controller_1.gameStateMachine(io, game, state, args);
            });
            socket.on('join team', function (_a) {
                var teamID = _a.teamID;
                var player = filters_1.getPlayer(game, socket.id);
                if (player === undefined) {
                    console.log("Unregistered Player");
                    emitter.sendError(socket, 'Player is not registered');
                }
                else {
                    // check if unassigned
                    if (player.teamID === -1) {
                        game.players["delete"](player.id);
                    }
                    else {
                        // remove from team
                        socket.leave(player.teamID.toString());
                        var team_1 = filters_1.getByID(game.teams, player.teamID);
                        team_1.players = team_1.players.filter(function (p) { return p.id !== player.id; });
                    }
                    // add to team
                    socket.join(teamID);
                    player.teamID = teamID;
                    var team = filters_1.getByID(game.teams, teamID);
                    if (team === undefined) {
                        console.log("Team not found");
                        emitter.sendError(socket, 'Team not found');
                    }
                    else {
                        team.players.push(player);
                        emitter.updatePlayer(socket, player);
                        emitter.updateTeams(io, game);
                        emitter.updatePlayers(io, game);
                        emitter.updateChat(io, team);
                    }
                }
            });
            socket.on('add team', function (_a) {
                var name = _a.name, color = _a.color;
                // Check if team name and color exist
                if (game.teams.find(function (team) { return (name === team.name); }) !== undefined) {
                    emitter.sendError(socket, 'Team name is taken!');
                    return;
                }
                if (game.teams.find(function (team) { return (color === team.color); }) !== undefined) {
                    emitter.sendError(socket, 'Color is taken!');
                    return;
                }
                // Create Team
                var team = new structs_1.Team(codes_1.generateTeamID(game.teams), name, color);
                game.teams.push(team);
                emitter.addTeam(io, game.id, team);
            });
            socket.on('delete team', function (_a) {
                var id = _a.id;
                game.teams = game.teams.filter(function (team) { return (id !== team.id); });
                emitter.deleteTeam(io, game.id, id);
            });
            socket.on('team chat', function (_a) {
                var teamID = _a.teamID, message = _a.message;
                var player = filters_1.getPlayer(game, socket.id);
                if (player === undefined || player.teamID !== teamID) {
                    emitter.sendError(socket, 'Not allowed to talk to another team.');
                }
                else {
                    // Get Team
                    var team = filters_1.getByID(game.teams, teamID);
                    var chatEntry = new structs_1.ChatEntry(player.name, message);
                    team.chat.push(chatEntry);
                    emitter.updateChat(io, team);
                }
            });
            socket.on('disconnect', function (reason) {
                var player = filters_1.getPlayer(game, socket.id);
                console.log("Disconnecting due to " + reason + ": " + socket.id + " - " + ((player !== undefined) && player.name));
                if ((game !== undefined) && !controller_1.isGameStarted(game)) {
                    console.log("Delete Player: " + socket.id + " - " + ((player !== undefined) && player.name));
                    // Delete player
                    game.players["delete"](socket.id);
                    // Remove from teams
                    game.teams = game.teams.map(function (team) {
                        return __assign(__assign({}, team), { players: team.players.filter(function (player) { return player.id !== socket.id; }) });
                    });
                    emitter.updatePlayers(io, game);
                }
                else {
                    if (player !== undefined) {
                        // Store disconnected player
                        console.log('Store ' + player.name);
                        game.cachedPlayers.push(player);
                    }
                }
            });
            socket.on('reconnect', function () {
                console.log("Attempting to reconnect to io: " + socket.id);
            });
        }
        else {
            console.error("Game " + gameID + " does not exist!");
        }
    });
}
exports.createSocket = createSocket;
;
