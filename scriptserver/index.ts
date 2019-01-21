import express from 'express';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as fs from 'fs-extra';
import * as path from 'path';
import socketIO from 'socket.io';
import { Server } from 'http';
import { Script } from './script';
import multer from 'multer';

const integrity = fs.readFileSync('.integrity').toString();
let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
let http = new Server(app);
let io = socketIO(http);

const SCRIPTS: { [name: string]: Script } = {};
const LASTTICKS: { [name: string]: any } = {};
const STATUS: { [name: string]: any } = {};

io.on('connection', (socket) => {
    if (socket.handshake.headers.integrity != integrity) {
        return io.to(socket.id).emit('verified', false);
    } else {
        io.to(socket.id).emit('verified', true);
        socket.on('disconnect', () => {
            // disconnected
        });
    }
});


app.use(function(req, res, next){
    if (req.header('integrity') != integrity) {
        return res.json({ success: false });
    } else {
        return next();
    }
});

let pluginsFolder = path.join(__dirname, 'script', 'plugins');
let uploadFolder = path.join(__dirname, 'plugin_upload')
let upload = multer({ storage: multer.diskStorage({ destination: pluginsFolder, filename: (_req, file, callback) => callback(null, file.originalname) })});

app.post('/plugins', upload.array('file'), function(req, res) {
    return res.json({ success: true });
});

app.get('/ping', function(_, res) {
    return res.json({ success: true, time: Date.now() });
});

app.post('/run', async function(req, res) {
    let name = req.query.name;
    if (SCRIPTS[name]) {
        return res.json({ success: true });
    }
    let script = new Script(req.body);

    // IO
    script.socket.on('default', data => {
        if (data.action == 'status') {
            STATUS[name] = { value: data.data, time: Date.now() };
        } else if (data.action == 'tick') {
            LASTTICKS[name] = { value: data.data, time: Date.now() };
        }
    });
    script.socket.on('plugin', data => io.emit('transfer', name, 'plugin', data));
    script.socket.on('widget', data => io.emit('transfer', name, 'widget', data));
    script.socket.on('storage', data => io.emit('transfer', name, 'storage', data));
    io.on('transfer-' + name, (action, data) => script.socket.emit(action, data));

    SCRIPTS[name] = script;
    let response = await script.send('setup');
    return res.json(response);
});

app.get('/status', async function(req, res) {
    let name = req.query.name;
    let status = STATUS[name];
    if (status) {
        return res.json({ success: true, status });
    } else {
        return res.json({ success: false, message: 'no status entry for this script' });
    }
});

app.get('/lasttick', async function(req, res) {
    let name = req.query.name;
    let lasttick = LASTTICKS[name];
    if (lasttick) {
        return res.json({ success: true, data: lasttick });
    } else {
        return res.json({ success: false, message: 'no tickdata found for this script' });
    }
});

http.listen(4102);