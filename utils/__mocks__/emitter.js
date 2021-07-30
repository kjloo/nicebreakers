const dummyRevealAnswer = (s, game) => {
    return;
}

const dummySetWinner = (s, game) => {
    return;
}

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
    revealAnswer: dummyRevealAnswer,
    setWinner: dummySetWinner,
    updatePlayers: dummyUpdatePlayers,
    updateState: dummyUpdateState,
    updateTeams: dummyUpdateTeams
};