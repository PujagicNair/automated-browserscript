import express from 'express';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as path from 'path';
import mongoose from 'mongoose';
import sharedSessions from 'express-socket.io-session';
import cookieSession from 'cookie-session';
import { Server } from 'http';
import socketIO from 'socket.io';
import Router from './Handlers/router';
import { Auth } from './Handlers/auth';
import { createUserModel } from './user';
import { TribalHackApi } from './hack/api';

(async () => {
    // server setup
    let app = express();
    let http = new Server(app);
    global.io = socketIO(http);
    global.sockets = {};

    let mongodb = await mongoose.connect('mongodb://localhost:27017/tribal', { useNewUrlParser: true });
    global.connection = mongodb.connection;
    
    createUserModel();
    
    if (process.argv[2] == '--prod') {
        await global.connection.dropDatabase();
        console.log('droped database');
    }

    TribalHackApi.setup();

    let sess = cookieSession({
        name: 'session',
        keys: ['hello', 'mi name', 'arber'],
        maxAge: 9999 * 60 * 60 * 1000
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
    app.get('**', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

    // boot
    http.listen(80);
})();