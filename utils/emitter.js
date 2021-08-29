"use strict";
exports.__esModule = true;
exports.setWinner = exports.sendError = exports.setReady = exports.updateState = exports.revealAnswer = exports.updateChat = exports.deleteTeam = exports.addTeam = exports.updateTeams = exports.updatePlayers = exports.updatePlayer = void 0;
var enums = require('./enums');
var filters = require('./filters');
// Socket functions
function updatePlayer(s, player) {
    console.log('Update player ' + player.name + ' on ' + s.id);
    s.emit('update player', player);
}
exports.updatePlayer = updatePlayer;
function updatePlayers(io, game) {
    var players = filters.getPlayers(game);
    io["in"](game.id).emit('update players', players);
}
exports.updatePlayers = updatePlayers;
function updateTeams(io, game) {
    var teams = filters.getTeams(game);
    io["in"](game.id).emit('update teams', teams);
}
exports.updateTeams = updateTeams;
function addTeam(io, gameID, team) {
    // need to tell everyone changes in teams
    io["in"](gameID).emit('add team', team);
}
exports.addTeam = addTeam;
function deleteTeam(io, gameID, id) {
    // need to tell everyone changes in teams
    io["in"](gameID).emit('delete team', id);
}
exports.deleteTeam = deleteTeam;
function updateChat(io, team) {
    // should only go to members of team
    io["in"](team.id.toString()).emit('team chat', { teamID: team.id, data: team.chat });
}
exports.updateChat = updateChat;
function revealAnswer(io, game) {
    io["in"](game.id).emit('reveal answer', game.question);
}
exports.revealAnswer = revealAnswer;
function updateState(io, game, state) {
    game.state = state;
    console.log("Game " + game.id + " State: " + game.state);
    io["in"](game.id).emit('set state', state);
}
exports.updateState = updateState;
function setReady(io, gameID, ready) {
    io["in"](gameID).emit('ready', ready);
}
exports.setReady = setReady;
function sendError(s, message) {
    s.emit('exception', message);
}
exports.sendError = sendError;
function setWinner(io, game) {
    // Get winner
    var winner = game.teams.reduce(function (pre, next) {
        return pre.score > next.score ? pre : next;
    });
    // There might have been more than one team with the same score
    var tie = game.teams.filter(function (team) { return team.score === winner.score; });
    if (tie.length > 1) {
        winner = undefined;
    }
    io["in"](game.id).emit('set winner', winner);
}
exports.setWinner = setWinner;
