import express from 'express';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as path from 'path';
import socketIO from 'socket.io';
import { Server } from 'http';
import { Script } from './script';
import multer from 'multer';

const integrity = '0xDeadFuckTard';
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
        await SCRIPTS[name].send('reload');
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
            let last = LASTTICKS[name] || {};
            let tick = {};
            for (let vid in data.data) {
                tick[vid] = {};
                for (let plugin in data.data[vid]) {
                    tick[vid][plugin] = { data: data.data[vid][plugin], time: new Date().toUTCString() };
                }
            }
            for (let vid in last) {
                if (!tick[vid]) {
                    tick[vid] = {};
                }
                for (let plugin in last[vid]) {
                    if (!tick[vid][plugin]) {
                        tick[vid][plugin] = last[vid][plugin];
                    }
                }
            }
            LASTTICKS[name] = tick;
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

    io.emit('transfer', name, 'default', { action: 'status', data: 'received start message' });

    setTimeout(async () => {
        SCRIPTS[name] = script;
        io.emit('transfer', name, 'default', { action: 'status', data: 'creating script process' });
        let response = await script.send('setup');
        if (response.success) {
            return res.json({ success: true });    
        } else {
            io.emit('transfer', name, 'default', { action: 'status', data: 'failed to start (' + response.message + ')' });
            return res.json({ success: false });
        }
    }, 1500);
});

app.get('/status', async function(req, res) {
    let name = req.query.name;
    let status = STATUS[name];
    if (status) {
        let ws = await SCRIPTS[name].send('ws');
        return res.json({ success: true, status, ws: ws.url });
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
    script.exit();
    delete SCRIPTS[name];
    delete LASTTICKS[name];
    delete STATUS[name];
    io.emit('transfer', name, 'default', { action: 'status', data: 'offline' });
    return res.json(exit);
});

http.listen(4102);