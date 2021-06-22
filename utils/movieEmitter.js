const enums = require('./enums');
const filters = require('./filters');

// Socket functions
const updatePlayer = (s, player) => {
    console.log('Update player ' + player.name + ' on ' + s.id);
    s.emit('update player', player);
}

const updatePlayers = (io, game) => {
    const players = filters.getPlayers(game);
    io.in(game.id).emit('update players', players);
}

const updateTeams = (io, game) => {
    const teams = filters.getTeams(game);
    io.in(game.id).emit('update teams', teams);
}

const addTeam = (io, gameID, team) => {
    // need to tell everyone changes in teams
    io.in(gameID).emit('add team', team);
}

const deleteTeam = (io, gameID, id) => {
    // need to tell everyone changes in teams
    io.in(gameID).emit('delete team', id);
}

const updateChat = (io, team) => {
    // should only go to members of team
    io.in(team.id).emit('team chat', { teamID: team.id, data: team.chat });
}

const revealAnswer = (io, game) => {
    io.in(game.id).emit('reveal answer', game.answer);
}

const updateState = (io, game, state) => {
    game.state = state;
    console.log("Game " + game.id + " State: " + game.state);
    io.in(game.id).emit('set state', state);
}

const sendError = (s, message) => {
    s.emit('exception', message);
}

const setWinner = (io, game) => {
    // Get winner
    let winner = game.teams.reduce((pre, next) => {
        return pre.score > next.score ? pre : next;
    });
    // There might have been more than one team with the same score
    const tie = game.teams.filter((team) => team.score === winner.score);
    if (tie.length > 1) {
        winner = undefined;
    }
    io.in(game.id).emit('set winner', winner);
}

module.exports = {
    addTeam: addTeam,
    deleteTeam: deleteTeam,
    revealAnswer: revealAnswer,
    sendError: sendError,
    setWinner: setWinner,
    updateChat: updateChat,
    updatePlayer: updatePlayer,
    updatePlayers: updatePlayers,
    updateState: updateState,
    updateTeams: updateTeams
}