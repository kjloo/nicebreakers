const dummyRevealAnswer = (s, game) => {
    return;
}

const dummySetReady = (s, game, ready) => {
    return true;
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
    setReady: dummySetReady,
    setWinner: dummySetWinner,
    updatePlayers: dummyUpdatePlayers,
    updateState: dummyUpdateState,
    updateTeams: dummyUpdateTeams
};