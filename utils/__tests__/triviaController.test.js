import { TriviaController } from '../triviaController';
import { GameState } from '../enums';
import { game } from '../__stubs__/gameStub';

jest.mock('../emitter');

console.log(game);
let controller = new TriviaController(game);

describe("Trivia Controller Test", () => {

    beforeEach(() => {
        controller.resetGameState(undefined, game);
    });

    test('check start state state', () => {
        expect(controller.isGameStarted(game)).toBe(false);
        controller.gameStateMachine({}, game, GameState.SETUP, {});
        expect(game.state).toBe(GameState.ENTRY);
    });
});