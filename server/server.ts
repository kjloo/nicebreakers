import * as http from 'http';
import app from './app';
const socketManager = require('../utils/socketManager');

const server = http.createServer(app);
socketManager.createSocket(server);
server.listen(3000);