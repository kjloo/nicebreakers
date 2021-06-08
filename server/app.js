global.__basedir = __dirname;
const { router } = require('../utils/routes');
const movieState = require('../utils/movieState');
const express = require('express');

const app = express();

// Middleware
app.use('/', router);

// Consts
const timeout = 60000; // 60 sec
// Execute code
setInterval(movieState.garbageCollection, timeout, movieState.globalGames);

module.exports = app;