const enums = require('./enums');
const filters = require('./filters');
const movieSocket = require('./movieSocket');

// const assets
let globalGames = [];
let globalMessages = [];

// Garbage collection
const garbageCollection = () => {
    // remove any inactive game ids
    globalGames = globalGames.filter((game) => {
        return (filters.getPlayers(game).length === 0);
    });
}

// Read/Write Game State
const getCurrentPlayer = (teams, gameState) => {
    // Get player
    let playerIndex = teams[gameState.teamIndex].playerIndex;
    let player = teams[gameState.teamIndex].players[playerIndex];
    return player;
}

const getCurrentTeam = (teams, gameState) => {
    let team = teams[gameState.teamIndex];
    return team;
}

const incrementTeamIndex = (teams, gameState) => {
    gameState.teamIndex++;
    // Check if valid
    if (gameState.teamIndex >= teams.length) {
        gameState.teamIndex = 0;
    }
}

const incrementPlayerIndex = (teams, gameState) => {
    teams[gameState.teamIndex].playerIndex++;
    // Check if valid
    if (teams[gameState.teamIndex].playerIndex >= teams[gameState.teamIndex].players.length) {
        teams[gameState.teamIndex].playerIndex = 0;
    }
}

const changeTeamTurns = (teams, gameState) => {
    // Set old team to false
    let team = getCurrentTeam(teams, gameState);
    team.turn = false;

    // Increment
    incrementTeamIndex(teams, gameState);
    // Set new team to true
    team = getCurrentTeam(teams, gameState);
    team.turn = true;
}

const changePlayerTurns = (teams, gameState) => {
    // Set old player to false
    let player = getCurrentPlayer(teams, gameState);
    player.turn = false;

    // Change teams
    changeTeamTurns(teams, gameState);
    // Set new player to true
    incrementPlayerIndex(teams, gameState);
    player = getCurrentPlayer(teams, gameState);
    player.turn = true;
}

const resetGameState = (s, game) => {
    game.teams = game.teams.map((team) => {
        return {
            ...team, score: 0, turn: false, players: team.players.map((player) => {
                return { ...player, turn: false }
            })
        };
    });

    movieSocket.updateTeams(s, game);
    movieSocket.updatePlayers(s, game);
}

// Get Chat
const getChat = (player) => {
    // Only return chat with matching team id
    let rc = globalMessages.find((chat) => chat.teamID === player.teamID);
    if (rc === undefined) {
        return [];
    }
    return rc;
}

// Game State Machine
const incrementGameState = (s, game) => {
    let teams = game.teams;
    // Move the turn along
    changePlayerTurns(teams, game);
    // Update sockets
    movieSocket.updatePlayers(s, game);
    movieSocket.updateTeams(s, game);
}

const updateScore = (s, game, state) => {
    // give point based on state
    // give point to team with turn if GUESS else STEAL
    let point = (state === enums.GameState.GUESS);
    // update score
    game.teams = game.teams.map((team) => {
        if (team.turn === point) {
            return { ...team, score: team.score + 1 }
        } else {
            return team;
        }
    });
    // change turns
    incrementGameState(s, game);
    // back to beginning
    movieSocket.revealAnswer(s, game);
}

const gameStateMachine = (s, game, state, args) => {
    switch (state) {
        case enums.GameState.SETUP:
            // TO DO: Should probably validate game
            // Send started to all
            movieSocket.setStarted(s, game.id, true);
            // Set first turn
            incrementGameState(s, game);
            movieSocket.updateState(s, game.id, enums.GameState.ENTRY);
            break;
        case enums.GameState.ENTRY:
            game.answer = args.answer;
            movieSocket.updateState(s, game.id, enums.GameState.HINT);
            break;
        case enums.GameState.HINT:
            movieSocket.updateState(s, game.id, enums.GameState.STEAL);
            break;
        case enums.GameState.STEAL:
            if (args.correct === true) {
                updateScore(s, game, state);
            } else {
                movieSocket.updateState(s, game.id, enums.GameState.GUESS);
            }
            break;
        case enums.GameState.GUESS:
            if (args.correct === true) {
                updateScore(s, game, state);
            } else {
                // change turns
                incrementGameState(s, game);
                // back to beginning
                movieSocket.revealAnswer(s, game);
            }
            break;
        case enums.GameState.REVEAL:
            movieSocket.updateState(s, game.id, enums.GameState.ENTRY);
            break;
        case enums.GameState.END:
            // Reset to beginning
            movieSocket.setStarted(s, game.id, false);
            // Set winner
            movieSocket.setWinner(s, game);
            // Reset game
            resetGameState(s, game);
            movieSocket.updateState(s, game.id, enums.GameState.SETUP);
            break;
    }
}

module.exports = {
    changePlayerTurns: changePlayerTurns,
    changeTeamTurns: changeTeamTurns,
    gameStateMachine: gameStateMachine,
    garbageCollection: garbageCollection,
    getChat: getChat,
    getCurrentPlayer: getCurrentPlayer,
    getCurrentTeam: getCurrentTeam,
    globalGames: globalGames,
    globalMessages: globalMessages,
    incrementGameState: incrementGameState,
    incrementPlayerIndex: incrementPlayerIndex,
    incrementTeamIndex: incrementTeamIndex,
    resetGameState: resetGameState,
    updateScore: updateScore,
}