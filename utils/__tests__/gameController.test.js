import { GameController } from '../gameController';
import { stubGame } from '../__stubs__/gameStub';
import { GameState } from '../enums';

jest.mock('../emitter');

let controller = new GameController(undefined, stubGame);

describe("Base State Manager Test", () => {

    beforeEach(() => {
        controller.resetGameState(undefined, stubGame);
    });

    test('check stubGame started', () => {
        expect(controller.isGameStarted(stubGame)).toBe(false);

        // Start stubGame
        stubGame.state = GameState.ANSWER;

        expect(controller.isGameStarted(stubGame)).toBe(true);
    });

    test('reset stubGame state', () => {
        controller.resetGameState(undefined, stubGame);
        expect(stubGame.cachedPlayers).toEqual([]);
        stubGame.teams.forEach((team) => {
            expect(team.score).toBe(0);
        });
        expect(stubGame.teamIndex).toBe(0);
    });
});