import express from 'express';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as path from 'path';
import mongoose from 'mongoose';
import session from 'express-session';
import sharedSessions from 'express-socket.io-session';
import { Server } from 'http';
import socketIO from 'socket.io';
import Router from './Handlers/router';
import Logger from './Handlers/logger';
import * as shared from './shared';
import { TribalHack } from './Browser/TribalHack';
import { createUserModel } from './Models/user';

(async () => {
    // server setup
    let app = express();
    let http = new Server(app);
    let io = socketIO(http);
    let logger = new Logger(console.log);

    let mongodb = await mongoose.connect('mongodb://localhost:27017/tribal', { useNewUrlParser: true });
    let conn = mongodb.connection;
    
    createUserModel(conn);
    await TribalHack.setup(conn);

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


    // boot
    http.listen(80);
})();