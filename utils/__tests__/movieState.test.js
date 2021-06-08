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

    // Validate game
    expect(games.get(gameID)).toEqual(game);
    // Run cleanup
    movieState.garbageCollection(games);
    expect(games.get(gameID)).toBeUndefined();
});

test('check game started', () => {
    expect(movieState.isGameStarted(stub.game)).toBe(false);

    // Start game
    movieState.gameStateMachine({}, stub.game, enums.GameState.SETUP, {});

    expect(movieState.isGameStarted(stub.game)).toBe(true);
});

test('check current player', () => {
    // Player should be bob
    expect(movieState.getCurrentPlayer(stub.teams, stub.game)).toEqual(stub.bob);
    // Move to next player
    movieState.incrementPlayerIndex(stub.teams, stub.game);
    // Player should be sean
    expect(movieState.getCurrentPlayer(stub.teams, stub.game)).toEqual(stub.sean);
    // Move to next player
    movieState.incrementPlayerIndex(stub.teams, stub.game);
    // Should wrap back around. Player should be bob
    expect(movieState.getCurrentPlayer(stub.teams, stub.game)).toEqual(stub.bob);
});

test('check current team', () => {
    // Team should be fish
    expect(movieState.getCurrentTeam(stub.teams, stub.game)).toEqual(stub.fish);
    // Move to next team
    movieState.incrementTeamIndex(stub.teams, stub.game);
    // Team should be cat
    expect(movieState.getCurrentTeam(stub.teams, stub.game)).toEqual(stub.cat);
    // Move to next team
    movieState.incrementTeamIndex(stub.teams, stub.game);
    // Should wrap back around. Team should be fish
    expect(movieState.getCurrentTeam(stub.teams, stub.game)).toEqual(stub.fish);

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

test('clear state', () => {
    expect(undefined).toBeUndefined();
});