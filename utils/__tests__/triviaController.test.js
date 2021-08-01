import { TriviaController } from '../triviaController';
import { GameState } from '../enums';
const stub = require('../__stubs__/gameStub');

jest.mock('../emitter');

let controller = new TriviaController(stub.game);

describe("Trivia Controller Test", () => {

    beforeEach(() => {
        controller.resetGameState(undefined, stub.game);
    });

    test('check start state state', () => {
        expect(controller.isGameStarted(stub.game)).toBe(false);
        controller.gameStateMachine({}, stub.game, GameState.SETUP, {});
        expect(stub.game.state).toBe(GameState.ENTRY);
    });
});