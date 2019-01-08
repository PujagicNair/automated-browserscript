"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// imports
const chrome = __importStar(require("phantom"));
const fs = __importStar(require("fs-extra"));
const express_1 = __importDefault(require("express"));
const httpInt = __importStar(require("http"));
const bodyParser = __importStar(require("body-parser"));
const socket_io_1 = __importDefault(require("socket.io"));
const get_recources_1 = __importDefault(require("./functions/get_recources"));
const levels_of_1 = __importDefault(require("./functions/levels_of"));
const build_queue_1 = __importDefault(require("./functions/build_queue"));
const check_1 = __importDefault(require("./functions/check"));
const path_1 = require("path");
// network handle
let app = express_1.default();
let http = new httpInt.Server(app);
let io = socket_io_1.default(http);
// create vars
let queue = [], building = [], levels = [], recources = {};
let sleep = ms => new Promise(r => setTimeout(r, ms));
let world, village_id = '46771', screen;
let browser, tab;
io.on('connect', socket => {
    io.to(socket.id).emit('queue', queue);
    io.to(socket.id).emit('res', recources);
    io.to(socket.id).emit('building', building);
    io.to(socket.id).emit('levels', levels);
    io.to(socket.id).emit('logs', fs.readFileSync('out.txt').toString().split('\n'));
    io.to(socket.id).emit('var changed', 'started', isStarted || false);
    io.to(socket.id).emit('var changed', 'paused', isPaused || false);
    io.to(socket.id).emit('var changed', 'booted', isBooted || false);
    io.to(socket.id).emit('var changed', 'socket', true);
    if ((socket.handshake.headers.cookie || '').indexOf('houngoungagne=775672341') != -1) {
        socket.on('add queue', (str) => {
            queue.push(str);
            forceCheck = true;
            writeFile('[queue added] ' + str);
            io.emit('queue', queue);
        });
        socket.on('clear queue', () => {
            queue = [];
            forceCheck = true;
            writeFile('[cleared queue]');
            io.emit('queue', queue);
        });
        socket.on('force check', () => {
            forceCheck = true;
            writeFile('[check forced]');
        });
        socket.on('clear logs', () => {
            fs.writeFileSync('out.txt', '[cleared logs]');
            io.emit('logs', '[cleared logs]');
        });
        socket.on('restart', () => __awaiter(this, void 0, void 0, function* () {
            writeFile('[restarting]');
            yield kill();
            yield sleep(500);
            yield start();
        }));
        socket.on('kill', () => __awaiter(this, void 0, void 0, function* () {
            writeFile('[exiting]');
            yield kill();
            yield http.close();
            yield process.exit(0);
        }));
        socket.on('pause server', () => __awaiter(this, void 0, void 0, function* () {
            isPaused = !isPaused;
            if (isPaused) {
                yield kill();
                writeFile('[paused script]');
            }
            else {
                writeFile('[resumed script]');
                yield start();
            }
            io.emit('var changed', 'paused', isPaused);
        }));
    }
    else {
        io.to(socket.id).emit('error', 'Access to controlls denied, readonly mode');
    }
});
// api
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/fguck', function (_, res) {
    res.cookie('houngoungagne', '775672341');
    return res.redirect('/');
});
app.use(express_1.default.static(path_1.join(__dirname, 'public')));
http.listen(80);
// create reactor vars
((root) => {
    let _isPaused = false, _isStarted = false, _isBooted = false;
    Object.defineProperty(root, 'isPaused', { get() { return _isPaused; }, set(v) { _isPaused = v; io.emit('var changed', 'paused', v || false); } });
    Object.defineProperty(root, 'isStarted', { get() { return _isStarted; }, set(v) { _isStarted = v; io.emit('var changed', 'started', v || false); } });
    Object.defineProperty(root, 'isBooted', { get() { return _isBooted; }, set(v) { _isBooted = v; io.emit('var changed', 'booted', v || false); } });
})(global);
let forceCheck = false;
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isStarted && !isBooted) {
            isStarted = true;
            writeFile('***Starting Script***');
            // create
            browser = yield chrome.create(['--load-images=no']);
            tab = yield browser.createPage();
            // set screen var
            yield tab.on('onUrlChanged', function (url) {
                let match = url.match(/screen=(\w+)/);
                if (match) {
                    screen = match[1];
                }
            });
            // open
            yield tab.open('https://die-staemme.de/');
            writeFile('✔ Opened Page');
            // login
            yield tab.evaluate(function () {
                document.getElementById('user').value = "AboIsSoGood";
                document.getElementById('password').value = "Qay123456";
                document.querySelector('a.btn-login').click();
            });
            writeFile('✔ Logged in');
            // wait for login to be done
            yield sleep(2000);
            // select world
            world = yield tab.evaluate(function () {
                document.querySelector('a.world-select > span.world_button_active').click();
                return document.querySelector('a.world-select > span.world_button_active').innerText;
            });
            writeFile('✔ Selected world');
            // wait for world to be loaded
            yield sleep(2000);
            // open main building
            yield tab.evaluateJavaScript(`function() {document.querySelector('area[href="${urlOf(false, 'main')}"]').click();}`);
            writeFile('✔ Opened Main Building');
            yield sleep(1000);
            isBooted = true;
        }
    });
}
// runtime
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        // handle
        let nextCheck = 0, lastReason;
        function tick() {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                if (!isStarted && !isPaused) {
                    yield start();
                }
                else if (isStarted && !isBooted) {
                    writeFile('tick triggered without booted server');
                    return resolve();
                }
                else if (isPaused) {
                    return resolve();
                }
                recources = yield get_recources_1.default(tab);
                levels = yield levels_of_1.default(tab);
                building = yield build_queue_1.default(tab);
                io.emit('res', recources);
                io.emit('levels', levels);
                io.emit('building', building);
                if (Date.now() > nextCheck || forceCheck) {
                    let checked = yield check_1.default(tab, queue);
                    forceCheck = false;
                    nextCheck = checked.nextTime;
                    if (checked.hasDoneCustom) {
                        queue.shift();
                        io.emit('queue', queue);
                    }
                    writeFile(checked.reason);
                    if (checked.reason == lastReason) {
                        writeFile('same reason twice ???');
                    }
                    lastReason = checked.reason;
                    io.emit('next check', checked.nextTime);
                }
                return resolve();
            }));
        }
        // tick programm
        (() => __awaiter(this, void 0, void 0, function* () {
            while (true) {
                yield tick();
                yield sleep(25000);
            }
        }))();
    });
}
// start
(() => __awaiter(this, void 0, void 0, function* () { return yield run(); }))();
// util functions
function urlOf(abs = false, target) {
    return `${abs ? `https://${world}.die-staemme.de` : ''}/game.php?village=${village_id}&screen=${target || screen}`;
}
function writeFile(...content) {
    io.emit('logs', ...content);
    fs.appendFileSync('out.txt', '\n' + content.join(' '));
}
function kill() {
    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
        isStarted = false;
        isBooted = false;
        yield sleep(1000);
        yield tab.close();
        yield browser.exit();
        yield sleep(500);
        return resolve();
    }));
}
