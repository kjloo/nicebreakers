const enums = require('./enums');
const filters = require('./filters');

// Socket functions
const updatePlayers = (s, game) => {
    s.in(game.id).emit('update players', filters.getPlayers(game));
}

const updateTeams = (s, game) => {
    s.in(game.id).emit('update teams', game.teams);
}

const addTeam = (s, gameID, team) => {
    // need to tell everyone changes in teams
    s.in(gameID).emit('add team', team);
}

const deleteTeam = (s, gameID, id) => {
    // need to tell everyone changes in teams
    s.in(gameID).emit('delete team', id);
}

const setStarted = (s, gameID, started) => {
    s.in(gameID).emit('set started', started);
}

const updateChat = (s, teamID, chat) => {
    // should only go to members of team
    s.in(teamID).emit('team chat', chat);
}

const revealAnswer = (s, game) => {
    s.in(game.id).emit('reveal answer', game.answer);
    updateState(s, game.id, enums.GameState.REVEAL);
}

const updateState = (s, gameID, state) => {
    s.in(gameID).emit('set state', state);
}

const setWinner = (s, game) => {
    // Get winner
    let winner = game.teams.reduce((pre, next) => {
        return pre.score > next.score ? pre : next;
    });
    // There might have been more than one team with the same score
    const tie = game.teams.filter((team) => team.score === winner.score);
    if (tie.length > 1) {
        winner = undefined;
    }
    s.in(game.id).emit('set winner', winner);
}

module.exports = {
    addTeam: addTeam,
    deleteTeam: deleteTeam,
    revealAnswer: revealAnswer,
    setStarted: setStarted,
    setWinner: setWinner,
    updateChat: updateChat,
    updatePlayers: updatePlayers,
    updateState: updateState,
    updateTeams: updateTeams
}