"use strict";
exports.__esModule = true;
globalThis.__basedir = __dirname;
var routes_1 = require("../utils/routes");
var stateManager = require('../utils/stateManager');
var express = require('express');
var app = express();
// Middleware
app.use('/', routes_1["default"]);
// Consts
var timeout = 60000; // 60 sec
// Execute code
setInterval(stateManager.garbageCollection, timeout, stateManager.globalGames);
exports["default"] = app;
