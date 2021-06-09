const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const movieEmitter = require('../movieEmitter');
const filters = require('../filters');
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


    test('update players', (done) => {
        clientSocket.on('update players', (players) => {
            expect(players).toEqual(filters.getPlayers(stub.game));
            done();
        });
        movieEmitter.updatePlayers(io, stub.game);
    });
});