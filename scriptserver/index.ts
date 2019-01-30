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

let socketConn: SocketIO.Socket;

io.on('connection', (socket) => {
    if (socket.handshake.headers.integrity != integrity) {
        return io.to(socket.id).emit('verified', false);
    } else {
        io.to(socket.id).emit('verified', true);
        socketConn = socket;
        Object.keys(SCRIPTS).forEach(name => {
            let script = SCRIPTS[name];
            script.send('connected', true);
            socketConn.on('transfer-' + name, (action, data) => {
                script.socket.emit(action, data);
            });
        });
        socket.on('disconnect', () => {
            Object.keys(SCRIPTS).forEach(name => {
                SCRIPTS[name].send('connected', false);
            });
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
let upload = multer({ storage: multer.diskStorage({ destination: pluginsFolder, filename: (_req, file, callback) => callback(null, file.originalname) })});

app.post('/plugins', upload.array('file'), function(req, res) {
    console.log('plugins are updated');
    
    Object.keys(SCRIPTS).forEach(async name => {
        let s = await SCRIPTS[name].send('reload');
    });
    return res.json({ success: true });
});

app.get('/runtimes', async function(_req, res) {
    let runtimes = Object.keys(SCRIPTS);
    return res.json({ success: true, runtimes });
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
        io.emit('transfer', name, 'default', data);
    });
    script.socket.on('plugin', data => {
        io.emit('transfer', name, 'plugin', data);
    });
    script.socket.on('widget', data => {
        io.emit('transfer', name, 'widget', data);
    });
    script.socket.on('storage', data => io.emit('transfer', name, 'storage', data));
    socketConn.on('transfer-' + name, (action, data) => {
        script.socket.emit(action, data);
    });

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

app.get('/villages', async function(req, res) {
    let name = req.query.name;
    let script = SCRIPTS[name];
    if (!script) {
        return res.json({ success: false, message: 'script is not running on the server' });
    }
    let response = await script.send('villages');
    return res.json(response);
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

app.get('/openpage', async function(req, res) {
    let { name, plugin, village } = req.query;
    let script = SCRIPTS[name];
    if (script) {
        await script.send('openpage', { village, plugin });
        return res.json({ success: true });
    } else {
        return res.json({ success: false, message: 'script not found on the server' });
    }
});

app.get('/closepage', async function(req, res) {
    let { name, plugin, village } = req.query;
    let script = SCRIPTS[name];
    if (script) {
        await script.send('closepage', { plugin, village });
        return res.json({ success: true });
    } else {
        return res.json({ success: false, message: 'script not found on the server' });
    }
});

app.get('/kill', async function (req, res) {
    let name = req.query.name;
    let script = SCRIPTS[name];
    if (!script) {
        return res.json({ success: false, message: 'script not found on the server' });
    }
    let exit = await script.send('kill');
    if (exit.success) {
        delete SCRIPTS[name];
        delete LASTTICKS[name];
        delete STATUS[name];
    }
    io.emit('transfer', name, 'default', { action: 'status', data: 'offline' });
    return res.json(exit);
});

http.listen(4102);