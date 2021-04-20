const getByID = (list, id) => {
    if (!list) {
        return undefined;
    }
    return list.find((item) => item.id === id);
}

const findByFilter = (map, filter) => {
    if (!map) {
        return undefined;
    }
    for (let [key, item] of map.entries()) {
        if (filter(item)) {
            return item;
        }
    }
    return undefined;
}

const getByGameID = (map, gameID) => {
    if (!map) {
        return undefined;
    }
    return findByFilter(map, (item) => item.gameID === gameID);
}

const getByTeamID = (list, teamID) => {
    if (!list) {
        return undefined;
    }
    return list.filter((item) => item.teamID === teamID);
}

// Get Player
const getPlayer = (game, id) => {
    const players = getPlayers(game);
    const player = getByID(players, id);
    return player;
}
// Get Players
const getPlayers = (game) => {
    let players = Array.from(game.players.values());
    // iterate through teams in game
    if (game.teams.length !== 0) {
        players = players.concat(game.teams.reduce((pre, next) => {
            return pre.concat(next.players);
        }, []));
    }
    return players;
}

const getTeams = (game) => {
    return game.teams;
}

module.exports = {
    getByID: getByID,
    findByFilter: findByFilter,
    getByGameID: getByGameID,
    getByTeamID: getByTeamID,
    getPlayer: getPlayer,
    getPlayers: getPlayers,
    getTeams: getTeams
}