let logger = undefined;
if (process.env.HOST !== "server") {
    const winston = require('winston');

    logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: { service: 'user-service' },
        transports: [
            new winston.transports.File({ filename: 'server.log' })
        ],
    });
}

module.exports = {
    logger: logger
};