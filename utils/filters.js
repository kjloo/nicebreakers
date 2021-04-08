exports.getByID = (list, id) => {
    if (!list)
    {
        return undefined;
    }
    return list.find((item) => item.id === id);
}

exports.getByGameID = (list, gameID) => {
    if (!list)
    {
        return undefined;
    }
    return list.filter((item) => item.gameID === gameID);
}

exports.getByTeamID = (list, teamID) => {
    if (!list)
    {
        return undefined;
    }
    return list.filter((item) => item.teamID === teamID);
}


// Get Players
exports.getPlayers = (game) => {
    let players = game.players
    // iterate through teams in game
    if (game.teams.length !== 0) {
        players = players.concat(game.teams.reduce((pre, next) => {
            return { players: pre.players.concat(next.players) }
        }).players);
    }
    return players;
}