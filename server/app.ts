globalThis.__basedir = __dirname;
import router from '../utils/routes';
const stateManager = require('../utils/stateManager');
const express = require('express');

const app = express();

// Middleware
app.use('/', router);

// Consts
const timeout = 60000; // 60 sec
// Execute code
setInterval(stateManager.garbageCollection, timeout, stateManager.globalGames);

export default app;