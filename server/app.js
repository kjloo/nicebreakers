global.__basedir = __dirname;
const { router } = require('../utils/routes');
const movieState = require('../utils/movieState');
const movieSocket = require('../utils/movieSocket');
const http = require('http');
const express = require('express');

const app = express();

// Consts
const timeout = 60000; // 60 sec

// Middleware
app.use('/', router);

// Execute code
setInterval(movieState.garbageCollection, timeout);

const server = http.createServer(app);
movieSocket.createSocket(server);

server.listen(3000);