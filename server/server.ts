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
import { TribalHack } from './Browser/TribalHack';
import { createUserModel, User } from './Models/user';
import { TribalHackApi } from './Browser/TribalHack/api';
import { Auth } from './Handlers/auth';

(async () => {
    // server setup
    let app = express();
    let http = new Server(app);
    global.io = socketIO(http);
    global.logger = new Logger(console.log);
    global.sockets = {};

    let mongodb = await mongoose.connect('mongodb://localhost:27017/tribal', { useNewUrlParser: true });
    global.connection = mongodb.connection;
    
    createUserModel();
    await TribalHack.setup();
    TribalHackApi.setup();

    let sess = session({
        secret: 'keyboard cat',
        resave: true,
        saveUninitialized: true
    });

    // http runners
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(sess);
    global.io.use(sharedSessions(sess, cookieParser()));
    app.use(Auth.handler());
    app.use(Router.handler());
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('**', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

    // boot
    http.listen(80);
})();