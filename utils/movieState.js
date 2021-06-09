const { logger } = require('./logger.js');
const enums = require('./enums');
const filters = require('./filters');
const movieEmitter = require('./movieEmitter');

// const assets
let globalGames = new Map();

// Garbage collection
const garbageCollection = (games) => {
    // remove any inactive game ids
    games.forEach((game, key, map) => {
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

const getCurrentPlayer = (gameState) => {
    const team = getCurrentTeam(gameState);
    if (team === undefined) {
        logger.error("Invalid team index " + gameState.teamIndex);
        return undefined;
    }
    // Get player
    return team.players[team.playerIndex];
}

const getCurrentTeam = (gameState) => {
    return gameState.teams[gameState.teamIndex];
}

const incrementTeamIndex = (gameState) => {
    gameState.teamIndex++;
    // Check if valid
    if (gameState.teamIndex >= gameState.teams.length) {
        gameState.teamIndex = 0;
    }
}

const incrementPlayerIndex = (gameState) => {
    let teams = gameState.teams;
    teams[gameState.teamIndex].playerIndex++;
    // Check if valid
    if (teams[gameState.teamIndex].playerIndex >= teams[gameState.teamIndex].players.length) {
        teams[gameState.teamIndex].playerIndex = 0;
    }
}

const changeTeamTurns = (gameState) => {
    // Set old team to false
    let team = getCurrentTeam(gameState);
    team.turn = false;

    // Increment
    incrementTeamIndex(gameState);
    // Set new team to true
    team = getCurrentTeam(gameState);
    team.turn = true;
}

const changePlayerTurns = (gameState) => {
    // Set old player to false
    let player = getCurrentPlayer(gameState);
    if (player === undefined) {
        logger.error("Could not get player!");
        console.error("Could not get player!");
        return;
    }
    player.turn = false;
    // Move to next player
    incrementPlayerIndex(gameState);

    // Change teams
    changeTeamTurns(gameState);
    // Set new player to true
    player = getCurrentPlayer(gameState);
    player.turn = true;
}

const resetGameState = (s, game) => {
    logger.info('Resetting game state');
    // Delete cached players
    game.cachedPlayers = [];
    game.teams = game.teams.map((team) => {
        return {
            ...team, score: 0, turn: false, players: team.players.map((player) => {
                return { ...player, turn: false }
            }), playerIndex: 0
        };
    });
    game.teamIndex = 0;

    movieEmitter.updateTeams(s, game);
    movieEmitter.updatePlayers(s, game);
}

// Game State Machine
const incrementGameState = (s, game) => {
    // Move the turn along
    changePlayerTurns(game);
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
    globalGames: globalGames,
    incrementGameState: incrementGameState,
    incrementPlayerIndex: incrementPlayerIndex,
    incrementTeamIndex: incrementTeamIndex,
    isGameStarted: isGameStarted,
    resetGameState: resetGameState,
    updateScore: updateScore,
}