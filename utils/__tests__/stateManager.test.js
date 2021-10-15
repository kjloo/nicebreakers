import { gameControllerFactory, garbageCollection } from '../stateManager';
import { stubGame } from '../__stubs__/gameStub';
import { Game } from '../structs';
import { MovieController } from '../movieController';

jest.mock('../emitter');

describe("Base State Manager Test", () => {

    test('clear out unused games', () => {
        // Setup games
        const games = new Map();
        const gameID = "ABCD";
        const testGame = new Game(gameID);
        games.set(gameID, testGame);
        games.set(stubGame.gameID, stubGame);

        // Validate game
        expect(games.get(gameID)).toEqual(testGame);
        // Run cleanup
        garbageCollection(games);
        expect(games.get(gameID)).toBeUndefined();
        expect(games.get(stubGame.gameID)).toEqual(stubGame);
    });

    test('controller factory', () => {
        const controller = gameControllerFactory(stubGame);
        expect(controller.id).toEqual(stubGame.id);
        expect(controller).toBeInstanceOf(MovieController);
    })
});