import express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import { Server } from 'http';
import socketIO from 'socket.io';
import Router from './Handlers/router';
import Logger from './Handlers/logger';
import * as shared from './shared';
import { Browser } from './Browser';
import { TribalHack, EServer } from './Browser/TribalHack';

// server setup
let app = express();
let http = new Server(app);
let io = socketIO(http);
let logger = new Logger(console.log);

// share
shared.setLogger(logger);
shared.setIO(io);

// http runners
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(Router.handler());
app.use(express.static(path.join(__dirname, 'public')));
app.get('**', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));


// test only
io.on('connection', function(socket) {
    io.to(socket.id).emit('init', { status: 'running' });
});

(async () => {
    let b = new Browser({ loadImages: 'yes' });
    let h = new TribalHack(EServer.DE151, { username: 'AboIsSoGood', password: 'Qay123456' }, console.log);
    await h.setup(b);
    await h.start();
    while (true) {
        let be = Date.now();
        io.emit('screenshot', (await b.screenshot('jpeg')));
        console.log("took:", Date.now() - be);
    }
})();


// boot
http.listen(80);