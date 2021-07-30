"use strict";
exports.__esModule = true;
var http = require("http");
var app_1 = require("./app");
var socketManager = require('../utils/socketManager');
var server = http.createServer(app_1["default"]);
socketManager.createSocket(server);
server.listen(3000);
