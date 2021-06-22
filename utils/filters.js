const getByID = (list, id) => {
    if (!list || !(list instanceof Array)) {
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

const getByTeamID = (list, teamID) => {
    if (!list || !(list instanceof Array)) {
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
    let players = [];
    if (game !== undefined) {
        players = players.concat(Array.from(game.players.values()));
        // iterate through teams in game
        if (game.teams.length !== 0) {
            players = players.concat(game.teams.reduce((pre, next) => {
                return pre.concat(next.players);
            }, []));
        }
    } else {
        console.log("Game not defined!");
    }
    return players;
}

const getTeams = (game) => {
    if (game === undefined) {
        return undefined;
    }
    return game.teams;
}

module.exports = {
    getByID: getByID,
    findByFilter: findByFilter,
    getByTeamID: getByTeamID,
    getPlayer: getPlayer,
    getPlayers: getPlayers,
    getTeams: getTeams
}