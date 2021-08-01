"use strict";
exports.__esModule = true;
exports.getTeams = exports.getPlayers = exports.getPlayer = exports.getByTeamID = exports.findByFilter = exports.getByID = void 0;
function getByID(list, id) {
    if (!list || !(list instanceof Array)) {
        return undefined;
    }
    return list.find(function (item) { return item.id === id; });
}
exports.getByID = getByID;
function findByFilter(list, filter) {
    if (!list || !(list instanceof Array)) {
        return undefined;
    }
    return list.find(filter);
}
exports.findByFilter = findByFilter;
function getByTeamID(list, teamID) {
    if (!list || !(list instanceof Array)) {
        return undefined;
    }
    return list.filter(function (item) { return item.teamID === teamID; });
}
exports.getByTeamID = getByTeamID;
// Get Player
function getPlayer(game, id) {
    var players = getPlayers(game);
    var player = getByID(players, id);
    return player;
}
exports.getPlayer = getPlayer;
// Get Players
function getPlayers(game) {
    var players = [];
    if (game !== undefined) {
        players = players.concat(Array.from(game.players.values()));
        // iterate through teams in game
        if (game.teams.length !== 0) {
            players = players.concat(game.teams.reduce(function (pre, next) {
                return pre.concat(next.players);
            }, []));
        }
    }
    else {
        console.log("Game not defined!");
    }
    return players;
}
exports.getPlayers = getPlayers;
function getTeams(game) {
    if (game === undefined) {
        return undefined;
    }
    return game.teams;
}
exports.getTeams = getTeams;
