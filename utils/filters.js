exports.getByID = (list, id) => {
    return list.find((item) => item.id === id);
}

exports.getByGameID = (list, gameID) => {
    return list.filter((item) => item.gameID === gameID);
}

exports.getByTeamID = (list, teamID) => {
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