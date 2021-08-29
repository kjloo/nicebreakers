import { revealAnswer, updatePlayer, updateState, updateTeams, updatePlayers, updateChat, setReady, setWinner, addTeam, deleteTeam, sendError } from '../emitter';
import { stubGame, tom } from '../__stubs__/gameStub';
import { GameState } from '../enums';
import { Team, ChatEntry } from '../structs';
import { getPlayers, getTeams } from '../filters';
const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");

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
                socket.join(stubGame.id);
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
            expect(player).toEqual(tom);
            done();
        });
        updatePlayer(serverSocket, tom);
    });

    test('update players', (done) => {
        clientSocket.on('update players', (players) => {
            expect(players).toEqual(getPlayers(stubGame));
            done();
        });
        updatePlayers(io, stubGame);
    });

    test('update teams', (done) => {
        clientSocket.on('update teams', (teams) => {
            expect(teams).toEqual(getTeams(stubGame));
            done();
        });
        updateTeams(io, stubGame);
    });

    test('add/delete team', (done) => {
        const dragon = new Team(123, 'Dragon', 'blue');
        clientSocket.on('add team', (team) => {
            expect(team).toEqual(dragon);
            done();
        });
        clientSocket.on('delete team', (team) => {
            expect(team).toEqual(dragon);
            done();
        });

        addTeam(io, stubGame.id, dragon);
        deleteTeam(io, stubGame.id, dragon);
    });

    test('update chat', (done) => {
        const dragonID = 123
        serverSocket.join(dragonID.toString());
        const chat = [new ChatEntry('Tom', 'Hello'), new ChatEntry('Chad', "What's up?")];
        const dragon = new Team(dragonID, 'Dragon', 'blue');
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
            expect(answer).toBe(stubGame.question);
            done();
        });
        revealAnswer(io, stubGame);
    });

    test('ready', (done) => {
        const readyFlag = true
        clientSocket.on('ready', (ready) => {
            expect(ready).toBe(readyFlag);
            done();
        });
        setReady(io, stubGame.id, readyFlag);
    });

    test('update state', (done) => {
        const steal = GameState.STEAL;
        clientSocket.on('set state', (state) => {
            expect(state).toBe(steal);
            done();
        });
        updateState(io, stubGame, steal);
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
        stubGame.teams = stubGame.teams.map((team) => {
            return { ...team, score: 0 }
        });
        clientSocket.on('set winner', (winner) => {
            expect(winner).toBeNull();
            done();
        });
        setWinner(io, stubGame);
        done();
    });

    test('send winner', (done) => {
        stubGame.teams[0].score = 20;
        clientSocket.on('set winner', (winner) => {
            expect(winner).toBe(stubGame.teams[0]);
            done();
        });
        setWinner(io, stubGame);
        done();
    });
});