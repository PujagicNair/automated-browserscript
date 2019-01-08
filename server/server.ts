import express from 'express';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as path from 'path';
import * as mongoose from 'mongoose';
import session from 'express-session';
import sharedSessions from 'express-socket.io-session';
import { Server } from 'http';
import socketIO from 'socket.io';
import Router from './Handlers/router';
import Logger from './Handlers/logger';
import * as shared from './shared';

// server setup
let app = express();
let http = new Server(app);
let io = socketIO(http);
let logger = new Logger(console.log);

let conn = mongoose.createConnection('mongodb://localhost:27017/tribal', { useNewUrlParser: true, useMongoClient: true });

let sess = session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
});

// share
shared.setLogger(logger);
shared.setIO(io);

// http runners
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(sess);
io.use(sharedSessions(sess, cookieParser()));
app.use(Router.handler());
app.use(express.static(path.join(__dirname, 'public')));
app.get('**', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// test only
io.on('connection', function(socket: any) {
    shared.sessions[socket.handshake.session.user] = socket.id;
    io.to(socket.id).emit('init', { status: 'running' });
});


/*(async () => {
    let browser = new Browser({ loadImages: 'yes' });
    let hack = new TribalHack(EServer.DE161, { username: 'AboIsSoGood', password: 'Qay123456' }, console.log);
    await hack.setup(browser);
    await hack.start();
})();*/


// boot
http.listen(80);