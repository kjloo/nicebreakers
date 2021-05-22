const { logger } = require('./logger.js');
const enums = require('./enums');
const filters = require('./filters');
const movieEmitter = require('./movieEmitter');

// const assets
let globalGames = new Map();
let globalMessages = new Map();

// Garbage collection
const garbageCollection = () => {
    // remove any inactive game ids
    globalGames.forEach((game, key, map) => {
        if (filters.getPlayers(game).length === 0) {
            map.delete(key);
            console.log("Removed inactive game: " + key);
        }
    });
}

// Read/Write Game State
const isGameStarted = (game) => {
    return game.state !== enums.GameState.SETUP;
}

const getCurrentPlayer = (teams, gameState) => {
    const team = teams[gameState.teamIndex];
    if (team === undefined) {
        logger.error("Invalid team index " + gameState.teamIndex);
        return undefined;
    }
    // Get player
    const player = team.players[team.playerIndex];
    return player;
}

const getCurrentTeam = (teams, gameState) => {
    let team = teams[gameState.teamIndex];
    return team;
}

const getGameChat = (gameID) => {
    let gameChat = globalMessages.get(gameID);
    if (gameChat === undefined) {
        // Create chat

    }
    return globalMessages.get(gameID);
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
    if (player === undefined) {
        logger.error("Could not get player!");
        console.error("Could not get player!");
        return;
    }
    player.turn = false;

    // Change teams
    changeTeamTurns(teams, gameState);
    // Set new player to true
    incrementPlayerIndex(teams, gameState);
    player = getCurrentPlayer(teams, gameState);
    player.turn = true;
}

const resetGameState = (s, game) => {
    console.log('Resetting game state');
    // Delete cached players
    game.cachedPlayers = [];
    game.teams = game.teams.map((team) => {
        return {
            ...team, score: 0, turn: false, players: team.players.map((player) => {
                return { ...player, turn: false }
            })
        };
    });

    movieEmitter.updateTeams(s, game);
    movieEmitter.updatePlayers(s, game);
}

// Game State Machine
const incrementGameState = (s, game) => {
    let teams = game.teams;
    // Move the turn along
    changePlayerTurns(teams, game);
    // Update sockets
    movieEmitter.updatePlayers(s, game);
    movieEmitter.updateTeams(s, game);
}

const nextRound = (s, game) => {
    // change turns
    incrementGameState(s, game);
    // back to beginning
    movieEmitter.revealAnswer(s, game);
    movieEmitter.updateState(s, game, enums.GameState.REVEAL);
}

const updateScore = (s, game, state, correct) => {
    // check if correct answer given
    if (correct) {
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
        nextRound(s, game);
    } else {
        if (state === enums.GameState.STEAL) {
            movieEmitter.updateState(s, game, enums.GameState.GUESS);
        } else {
            nextRound(s, game);
        }
    }
}

const gameStateMachine = (s, game, state, args) => {
    switch (state) {
        case enums.GameState.SETUP:
            // Set first turn
            incrementGameState(s, game);
            movieEmitter.updateState(s, game, enums.GameState.ENTRY);
            break;
        case enums.GameState.ENTRY:
            game.answer = args.answer;
            movieEmitter.updateState(s, game, enums.GameState.HINT);
            break;
        case enums.GameState.HINT:
            movieEmitter.updateState(s, game, enums.GameState.STEAL);
            break;
        case enums.GameState.STEAL:
        case enums.GameState.GUESS:
            updateScore(s, game, state, args.correct);
            break;
        case enums.GameState.REVEAL:
            movieEmitter.updateState(s, game, enums.GameState.ENTRY);
            break;
        case enums.GameState.END:
            // Reset game
            movieEmitter.updateState(s, game, enums.GameState.SETUP);
            // Set winner
            movieEmitter.setWinner(s, game);
            // Reset to beginning
            resetGameState(s, game);
            break;
    }
}

module.exports = {
    changePlayerTurns: changePlayerTurns,
    changeTeamTurns: changeTeamTurns,
    gameStateMachine: gameStateMachine,
    garbageCollection: garbageCollection,
    getCurrentPlayer: getCurrentPlayer,
    getCurrentTeam: getCurrentTeam,
    getGameChat: getGameChat,
    globalGames: globalGames,
    globalMessages: globalMessages,
    incrementGameState: incrementGameState,
    incrementPlayerIndex: incrementPlayerIndex,
    incrementTeamIndex: incrementTeamIndex,
    isGameStarted: isGameStarted,
    resetGameState: resetGameState,
    updateScore: updateScore,
}