import 'regenerator-runtime/runtime';
import app from '../../server/app';
import { GameState, GameType } from '../enums';
import { registerGame, validateGameID } from '../routes';

const stateManager = require('../stateManager');
const stub = require('../__stubs__/gameStub');
const supertest = require('supertest');

describe("rest api routes", () => {

    beforeEach(() => {
        stateManager.globalGames = new Map();
    });

    test("Register Game", () => {
        const gameID = "ABCD";
        expect(registerGame(gameID, GameType.MOVIE)).toBe(true);
        const game = validateGameID(gameID);
        expect(game.id).toBe(gameID);
        expect(game.type).toBe(GameType.MOVIE);
    });

    test("GET /acronym", async () => {
        const acronym = "AAAA"
        await supertest(app).get("/acronym")
            .query({ gameID: acronym })
            .expect(200)
            .then((response) => {
                // Check type and length
                expect(response.body.decode).toBeDefined();
                // Check acronym is valid
                const actual = response.body.decode.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '');
                expect(actual).toBe(acronym);
            });
    });

    test("GET /player", async () => {
        const gameID = "ABCD";
        const player = "Tom";
        await supertest(app).get("/player")
            .query({ gameID: gameID })
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual({});
            });
        // Start a game
        await supertest(app).get('/game/')
            .query({ player: player, gameID: gameID })
            .expect(302)
        await supertest(app).get("/player")
            .query({ gameID: gameID })
            .expect(200)
            .then((response) => {
                expect(response.body.player).toEqual(player);
            });
    });

    test('GET /players', async () => {
        const gameID = stub.game.id;
        await supertest(app).get('/players/')
            .query({ gameID: gameID })
            .expect(200)
            .then((response) => {
                expect(response.body.players).toEqual([]);
            });
        // Add game and players
        stateManager.globalGames.set(stub.game.id, stub.game);
        await supertest(app).get('/players/')
            .query({ gameID: gameID })
            .expect(200)
            .then((response) => {
                expect(response.body.players).toEqual(stub.players);
            });
    });

    test('GET /state', async () => {
        const gameID = stub.game.id;
        await supertest(app).get('/state/')
            .query({ gameID: gameID })
            .expect(200)
            .then((response) => {
                expect(response.body.state).toBe(GameState.SETUP);
            });
        // change state
        stateManager.globalGames.set(stub.game.id, stub.game);
        stub.game.state = GameState.ANSWER;
        await supertest(app).get('/state/')
            .query({ gameID: gameID })
            .expect(200)
            .then((response) => {
                expect(response.body.state).toBe(GameState.ANSWER);
            });

    });

    test('GET /teams', async () => {
        const gameID = stub.game.id;
        await supertest(app).get('/teams/')
            .query({ gameID: gameID })
            .expect(200)
            .then((response) => {
                expect(response.body.teams).toBeUndefined();
            });
        // Add game and teams
        stateManager.globalGames.set(stub.game.id, stub.game);
        await supertest(app).get('/teams/')
            .query({ gameID: gameID })
            .expect(200)
            .then((response) => {
                expect(response.body.teams).toEqual(stub.teams);
            });
    });

    test('GET /game', async () => {
        const gameID = "ABCD";
        const player = "Tom";
        await supertest(app).get('/game/')
            .query({ player: player, gameID: gameID, gameType: GameType.MOVIE })
            .expect(302)
            .then((response) => {
                expect(response.redirect).toBe(true);
                expect(response.header.location).toBe('/game/' + gameID);
            });

        await supertest(app).get('/game/' + gameID)
            .expect(302)
            .then((response) => {
                expect(response.redirect).toBe(true);
                expect(response.header.location).toBe('/movie/game/' + gameID);
            });

        await supertest(app).get('/movie/game/' + gameID)
            .expect(200)
            .then((response) => {
                expect(response.redirect).toBe(false);
                expect(response.text).not.toBe("");
            });
    });

    test('/', async () => {
        await supertest(app).get('/')
            .expect(200)
            .then((response) => {
                expect(response.redirect).toBe(false);
                expect(response.text).not.toBe("");
            });
    });
});