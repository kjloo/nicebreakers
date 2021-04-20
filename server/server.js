const http = require('http');
const app = require('./app');
const movieSocket = require('../utils/movieSocket');

const server = http.createServer(app);
movieSocket.createSocket(server);
server.listen(3000);