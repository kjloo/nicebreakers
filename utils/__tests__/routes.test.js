const app = require('../../server/app');
const enums = require('../enums');
const movieState = require('../movieState');
const stub = require('../__stubs__/gameStub');
const supertest = require('supertest');
const movieEmitter = require('../movieEmitter');

describe("rest api routes", () => {

    beforeEach(() => {
        movieState.globalGames = new Map();
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
        await supertest(app).get('/movie/game/')
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
        movieState.globalGames.set(stub.game.id, stub.game);
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
                expect(response.body.state).toBe(enums.GameState.SETUP);
            });
        // change state
        movieState.globalGames.set(stub.game.id, stub.game);
        stub.game.state = enums.GameState.ANSWER;
        await supertest(app).get('/state/')
            .query({ gameID: gameID })
            .expect(200)
            .then((response) => {
                expect(response.body.state).toBe(enums.GameState.ANSWER);
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
        movieState.globalGames.set(stub.game.id, stub.game);
        await supertest(app).get('/teams/')
            .query({ gameID: gameID })
            .expect(200)
            .then((response) => {
                expect(response.body.teams).toEqual(stub.teams);
            });
    });

    test('GET /movie/game', async () => {
        const gameID = "ABCD";
        const player = "Tom";
        await supertest(app).get('/movie/game/')
            .query({ player: player, gameID: gameID })
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