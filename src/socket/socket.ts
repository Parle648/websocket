import { Server } from 'socket.io';

import * as config from './config.js';
import roomsSocket from './gameSockets/gameSocket.js';
import signInScoket from './signinSocket/signInSocket.js';

export default (io) => {
    io.on('connection', socket => {
        const username = socket.handshake.query.username;
    });

    signInScoket(io.of('/signin'));
    roomsSocket(io.of('/game'));
    // roomsSocket(io.of('/'));
};
