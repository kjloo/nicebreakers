import { updatePlayer, updateState, updateTeams, updatePlayers, updateChat, setReady } from '../emitter';
const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const filters = require('../filters');
const structs = require('../structs');
const enums = require('../enums');
const stub = require('../__stubs__/gameStub');

describe("socket emitter tests", () => {
    let io
    let serverSocket
    let clientSocket;

    beforeAll((done) => {
        const httpServer = createServer();
        io = new Server(httpServer);
        httpServer.listen(() => {
            const port = httpServer.address().port;
            clientSocket = new Client(`http://localhost:${port}`);
            io.on("connection", (socket) => {
                socket.join(stub.game.id);
                serverSocket = socket;
            });
            clientSocket.on("connect", done);
        });
    });

    afterAll(() => {
        io.close();
        clientSocket.close();
    });

    test('update player', (done) => {
        clientSocket.on('update player', (player) => {
            expect(player).toEqual(stub.tom);
            done();
        });
        updatePlayer(serverSocket, stub.tom);
    });

    test('update players', (done) => {
        clientSocket.on('update players', (players) => {
            expect(players).toEqual(filters.getPlayers(stub.game));
            done();
        });
        updatePlayers(io, stub.game);
    });

    test('update teams', (done) => {
        clientSocket.on('update teams', (teams) => {
            expect(teams).toEqual(filters.getTeams(stub.game));
            done();
        });
        updateTeams(io, stub.game);
    });

    test('add/delete team', (done) => {
        const dragon = new structs.Team(123, 'Dragon', 'blue');
        clientSocket.on('add team', (team) => {
            expect(team).toEqual(dragon);
            done();
        });
        clientSocket.on('delete team', (team) => {
            expect(team).toEqual(dragon);
            done();
        });

        addTeam(io, stub.game.id, dragon);
        deleteTeam(io, stub.game.id, dragon);
    });

    test('update chat', (done) => {
        const dragonID = 123
        serverSocket.join(dragonID);
        const chat = [new structs.ChatEntry('Tom', 'Hello'), new structs.ChatEntry('Chad', "What's up?")];
        const dragon = new structs.Team(dragonID, 'Dragon', 'blue');
        dragon.chat = chat;
        clientSocket.on('team chat', ({ teamID, data }) => {
            expect(teamID).toBe(dragonID);
            expect(data).toEqual(chat);
            done();
        });
        updateChat(io, dragon);
        serverSocket.leave(dragonID);
    });

    test('reveal answer', (done) => {
        clientSocket.on('reveal answer', (answer) => {
            expect(answer).toBe(stub.game.answer);
            done();
        });
        revealAnswer(io, stub.game);
    });

    test('ready', (done) => {
        const readyFlag = true
        clientSocket.on('ready', (ready) => {
            expect(ready).toBe(readyFlag);
            done();
        });
        setReady(io, stub.game.id, readyFlag);
    });

    test('update state', (done) => {
        const steal = enums.GameState.STEAL;
        clientSocket.on('set state', (state) => {
            expect(state).toBe(steal);
            done();
        });
        updateState(io, stub.game, steal);
    });

    test('send error', (done) => {
        const error = "An Error Occurred"
        clientSocket.on('exception', (message) => {
            expect(message).toBe(error);
            done();
        });
        sendError(serverSocket, error);
    });

    test('send tie game', (done) => {
        stub.game.teams = stub.game.teams.map((team) => {
            return { ...team, score: 0 }
        });
        clientSocket.on('set winner', (winner) => {
            expect(winner).toBeNull();
            done();
        });
        setWinner(io, stub.game);
        done();
    });

    test('send winner', (done) => {
        stub.game.teams[0].score = 20;
        clientSocket.on('set winner', (winner) => {
            expect(winner).toBe(stub.game.teams[0]);
            done();
        });
        setWinner(io, stub.game);
        done();
    });
});