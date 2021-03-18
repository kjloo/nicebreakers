exports.getByID = (list, id) => {
    return list.find((item) => item.id === id);
}

exports.getByGameID = (list, gameID) => {
    return list.filter((item) => item.gameID === gameID);
}

exports.getByTeamID = (list, teamID) => {
    return list.filter((item) => item.teamID === teamID);
}