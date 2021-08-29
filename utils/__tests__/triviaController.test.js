import { TriviaController } from '../triviaController';
import { GameState } from '../enums';
import { stubGame } from '../__stubs__/gameStub';

jest.mock('../emitter');

let controller = new TriviaController(undefined, stubGame);

describe("Trivia Controller Test", () => {

    beforeEach(() => {
        controller.resetGameState(undefined, stubGame);
    });

    test('check start state state', () => {
        expect(controller.isGameStarted(stubGame)).toBe(false);
        controller.gameStateMachine({}, stubGame, GameState.SETUP, {});
        expect(stubGame.state).toBe(GameState.SETUP);
    });
});