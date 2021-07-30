import { gameControllerFactory, garbageCollection } from '../stateManager';
const structs = require('../structs')
const stub = require('../__stubs__/gameStub');

jest.mock('../emitter');

describe("Base State Manager Test", () => {

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
        garbageCollection(games);
        expect(games.get(gameID)).toBeUndefined();
        expect(games.get(stub.game.gameID)).toEqual(stub.game);
    });

    test('controller factory', () => {
        const controller = gameControllerFactory(stub.game);
        expect(controller.id).toEqual(stub.game.id);
    })
});