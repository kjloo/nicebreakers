const movieState = require('../movieState');
const enums = require('../enums');
const stub = require('../__stubs__/gameStub');

jest.mock('../movieEmitter');

test('check game started', () => {
    expect(movieState.isGameStarted(stub.game)).toBe(false);

    // Start game
    movieState.gameStateMachine({}, stub.game, enums.GameState.SETUP, {});

    expect(movieState.isGameStarted(stub.game)).toBe(true);
})

test('clear state', () => {
    expect(undefined).toBeUndefined();
});