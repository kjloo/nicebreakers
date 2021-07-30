import winston = require('winston');
let logger = undefined;
if (process.env.HOST === "server") {

    logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: { service: 'user-service' },
        transports: [
            new winston.transports.File({ filename: 'server.log' })
        ],
    });
}

export default logger;