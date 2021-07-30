"use strict";
exports.__esModule = true;
var winston = require("winston");
var logger = undefined;
if (process.env.HOST === "server") {
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: { service: 'user-service' },
        transports: [
            new winston.transports.File({ filename: 'server.log' })
        ]
    });
}
exports["default"] = logger;
