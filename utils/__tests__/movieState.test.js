const movieState = require('../movieState');
const enums = require('../enums');
const structs = require('../structs')
const stub = require('../__stubs__/gameStub');

jest.mock('../movieEmitter');

beforeEach(() => {
    movieState.resetGameState(undefined, stub.game);
});

test('clear out unused games', () => {
    // Setup games
    const games = new Map();
    const gameID = "ABCD";
    const game = new structs.Game(gameID);
    games.set(gameID, game);
    games.set(stub.game.gameID, stub.game);

    // Validate game
    expect(games.get(gameID)).toEqual(game);
    // Run cleanup
    movieState.garbageCollection(games);
    expect(games.get(gameID)).toBeUndefined();
    expect(games.get(stub.game.gameID)).toEqual(stub.game);
});

test('check game started', () => {
    expect(movieState.isGameStarted(stub.game)).toBe(false);

    // Start game
    movieState.gameStateMachine({}, stub.game, enums.GameState.SETUP, {});

    expect(movieState.isGameStarted(stub.game)).toBe(true);
});

test('check current player', () => {
    let teamIndex = 0;
    let playerIndex = 0;
    // Player should be first player on first team
    expect(movieState.getCurrentPlayer(stub.game)).toEqual(stub.game.teams[teamIndex].players[playerIndex]);
    // Move to next player
    movieState.incrementPlayerIndex(stub.game);
    playerIndex = 1;
    // Player should be sean
    expect(movieState.getCurrentPlayer(stub.game)).toEqual(stub.game.teams[teamIndex].players[playerIndex]);
    // Move to next player
    movieState.incrementPlayerIndex(stub.game);
    // Should wrap back around. Player should be bob
    playerIndex = 0;
    expect(movieState.getCurrentPlayer(stub.game)).toEqual(stub.game.teams[teamIndex].players[playerIndex]);

    // Excercise player turn change
    movieState.changePlayerTurns(stub.game);
    teamIndex = 1;
    expect(movieState.getCurrentPlayer(stub.game)).toEqual(stub.game.teams[teamIndex].players[playerIndex]);
    expect(stub.game.teams[0].players[0].turn).toBe(false);
    expect(stub.game.teams[teamIndex].players[playerIndex].turn).toBe(true);
    expect(movieState.getCurrentTeam(stub.game)).toEqual(stub.game.teams[teamIndex]);

    // Exercise increment game state
    movieState.incrementGameState(undefined, stub.game);
    teamIndex = 0;
    playerIndex = 1;
    expect(movieState.getCurrentPlayer(stub.game)).toEqual(stub.game.teams[teamIndex].players[playerIndex]);
    expect(stub.game.teams[1].players[0].turn).toBe(false);
    expect(stub.game.teams[teamIndex].players[playerIndex].turn).toBe(true);
    expect(movieState.getCurrentTeam(stub.game)).toEqual(stub.game.teams[teamIndex]);
});

test('check current team', () => {
    teamIndex = 0;
    // Team should be fish
    expect(movieState.getCurrentTeam(stub.game)).toEqual(stub.game.teams[teamIndex]);
    // Move to next team
    movieState.incrementTeamIndex(stub.game);
    teamIndex = 1;
    // Team should be cat
    expect(movieState.getCurrentTeam(stub.game)).toEqual(stub.game.teams[teamIndex]);
    // Move to next team
    movieState.incrementTeamIndex(stub.game);
    teamIndex = 0;
    // Should wrap back around. Team should be fish
    expect(movieState.getCurrentTeam(stub.game)).toEqual(stub.game.teams[teamIndex]);

    // Use change team turns
    movieState.changeTeamTurns(stub.game);
    teamIndex = 1;
    // Team should be cat
    expect(movieState.getCurrentTeam(stub.game)).toEqual(stub.game.teams[teamIndex]);
    expect(stub.game.teams[teamIndex].turn).toBe(true);
    expect(stub.game.teams[0].turn).toBe(false);


});

test('reset game state', () => {
    movieState.resetGameState(undefined, stub.game);
    expect(stub.game.cachedPlayers).toEqual([]);
    stub.game.teams.forEach((team) => {
        expect(team.score).toBe(0);
    });
    expect(stub.game.teamIndex).toBe(0);
});

test('increment game state', () => {
    // Init state
    expect(stub.game.answer).toBe("");
    expect(stub.game.cachedPlayers).toEqual([]);
    // check sum of scores is 0
    let scores = stub.game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(0);

    // Start game
    let startState = enums.GameState.SETUP;
    let nextState = enums.GameState.ENTRY;
    movieState.gameStateMachine({}, stub.game, startState, {});
    expect(stub.game.state).toBe(nextState);

    // Hint
    startState = enums.GameState.ENTRY;
    nextState = enums.GameState.HINT;
    const answer = "Cats";
    movieState.gameStateMachine({}, stub.game, startState, { answer: answer });
    expect(stub.game.state).toBe(nextState);
    // Check answer
    expect(stub.game.answer).toBe(answer);

    // Steal
    startState = enums.GameState.HINT;
    nextState = enums.GameState.STEAL;
    movieState.gameStateMachine({}, stub.game, startState, {});
    expect(stub.game.state).toBe(nextState);

    // Guess
    startState = enums.GameState.STEAL;
    nextState = enums.GameState.GUESS;
    movieState.gameStateMachine({}, stub.game, startState, { correct: false });
    expect(stub.game.state).toBe(nextState);

    // check sum of scores is 0
    scores = stub.game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(0);

    // Reveal
    startState = enums.GameState.STEAL;
    nextState = enums.GameState.REVEAL;
    movieState.gameStateMachine({}, stub.game, startState, { correct: true });
    expect(stub.game.state).toBe(nextState);

    // check sum of scores is 1
    scores = stub.game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(1);

    startState = enums.GameState.GUESS;
    nextState = enums.GameState.REVEAL;
    movieState.gameStateMachine({}, stub.game, startState, { correct: true });
    expect(stub.game.state).toBe(nextState);

    // check sum of scores is 2
    scores = stub.game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(2);

    startState = enums.GameState.GUESS;
    nextState = enums.GameState.REVEAL;
    movieState.gameStateMachine({}, stub.game, startState, { correct: false });
    expect(stub.game.state).toBe(nextState);

    // check sum of scores is 2
    scores = stub.game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(2);

    // ENTRY
    startState = enums.GameState.REVEAL;
    nextState = enums.GameState.ENTRY;
    movieState.gameStateMachine({}, stub.game, startState, {});
    expect(stub.game.state).toBe(nextState);

    // END
    startState = enums.GameState.END;
    nextState = enums.GameState.SETUP;
    movieState.gameStateMachine({}, stub.game, startState, {});
    expect(stub.game.state).toBe(nextState);
    // check no cached players
    expect(stub.game.cachedPlayers).toEqual([]);
    // check sum of scores is 0
    scores = stub.game.teams.reduce((acc, cur) => acc + cur.score, 0);
    expect(scores).toBe(0);
    // check no turn set
    let turn = stub.game.teams.reduce((acc, cur) => acc || cur.turn, false);
    expect(turn).toBe(false);
});