import { GameController } from '../gameController';
const enums = require('../enums');
const stub = require('../__stubs__/gameStub');

jest.mock('../emitter');

let controller = new GameController(stub.game);

describe("Base State Manager Test", () => {

    beforeEach(() => {
        controller.resetGameState(undefined, stub.game);
    });

    test('check game started', () => {
        expect(controller.isGameStarted(stub.game)).toBe(false);

        // Start game
        stub.game.state = enums.GameState.ANSWER;

        expect(controller.isGameStarted(stub.game)).toBe(true);
    });

    test('reset game state', () => {
        controller.resetGameState(undefined, stub.game);
        expect(stub.game.cachedPlayers).toEqual([]);
        stub.game.teams.forEach((team) => {
            expect(team.score).toBe(0);
        });
        expect(stub.game.teamIndex).toBe(0);
    });
});