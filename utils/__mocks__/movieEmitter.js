const dummyUpdatePlayers = (s, teams) => {
    return;
}

const dummyUpdateState = (s, game, state) => {
    game.state = state;
    return;
}

const dummyUpdateTeams = (s, teams) => {
    return;
}

module.exports = {
    updatePlayers: dummyUpdatePlayers,
    updateState: dummyUpdateState,
    updateTeams: dummyUpdateTeams
};