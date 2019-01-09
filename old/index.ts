// imports
import * as chrome from 'phantom';
import * as fs from 'fs-extra';
import express from 'express';
import * as httpInt from 'http';
import * as bodyParser from 'body-parser';
import socketIO from 'socket.io';
import { anyElement, Webpage } from './functions/interfaces';
import getRecources from './functions/get_recources';
import levelsOf from './functions/levels_of';
import buildQueue from './functions/build_queue';
import check from './functions/check';
import { join } from 'path';

// overrwrite document
declare var document: {
    getElementById(id: string): anyElement
    querySelector(sel: string): anyElement;
    querySelectorAll(sel: string): Array<anyElement>;
};

// network handle
let app = express();
let http = new httpInt.Server(app);
let io = socketIO(http);

// create vars
let queue = [], building = [], levels = [], recources: any = {};
let sleep = ms => new Promise(r => setTimeout(r, ms));
let world, village_id = '4162', screen;
let browser: chrome.PhantomJS, tab: Webpage;

io.on('connect', async socket => {
    io.to(socket.id).emit('queue', queue);
    io.to(socket.id).emit('res', recources);
    io.to(socket.id).emit('building', building);
    io.to(socket.id).emit('levels', levels);
    io.to(socket.id).emit('logs', fs.readFileSync('out.txt').toString().split('\n'));
    io.to(socket.id).emit('var changed', 'started', isStarted || false);
    io.to(socket.id).emit('var changed', 'paused', isPaused || false);
    io.to(socket.id).emit('var changed', 'booted', isBooted || false);
    io.to(socket.id).emit('var changed', 'socket', true);
    io.to(socket.id).emit('screen', await tab.renderBase64('jpeg'));

    if (!0) {
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
        socket.on('restart', async () => {
            writeFile('[restarting]');
            await kill();
            await sleep(500);
            await start();
        });
        socket.on('click', async selector => {
            await tab.evaluateJavaScript(`function() {
                document.querySelector("${selector}").click();
            }`);
            await sleep(300);
            io.to(socket.id).emit('reload frame');
        });
        socket.on('screen', async () => {
            io.to(socket.id).emit('screen', await tab.renderBase64('jpeg'));
        });
        socket.on('kill', async () => {
            writeFile('[exiting]');
            await kill();
            await http.close();
            await process.exit(0);
        });
        socket.on('pause server', async () => {
            isPaused = !isPaused;
            if (isPaused) {
                await kill();
                writeFile('[paused script]');
            } else {
                writeFile('[resumed script]');
                await start();
            }
            io.emit('var changed', 'paused', isPaused);
        });
    } else {
        io.to(socket.id).emit('error', 'Access to controlls denied, readonly mode');
    }
});

// api
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/fguck', function(_, res) {
    res.cookie('houngoungagne', '775672341');
    return res.redirect('/');
});

app.get('/content.html', async function(req, res) {
    let content = await tab.evaluateJavaScript<string>('function() { return document.all[0].innerHTML }');
    content = content.replace(/<script[.\s\S]+?\/script>/g, '');
    res.status(200).send(content);
});

app.use(express.static(join(__dirname, 'public')));

http.listen(3000);

// create reactor vars
((root: any) => {
    let _isPaused = false, _isStarted = false, _isBooted = false;

    Object.defineProperty(root, 'isPaused', { get() { return _isPaused }, set(v) { _isPaused = v; io.emit('var changed', 'paused', v || false); } });
    Object.defineProperty(root, 'isStarted', { get() { return _isStarted }, set(v) { _isStarted = v; io.emit('var changed', 'started', v || false); } });
    Object.defineProperty(root, 'isBooted', { get() { return _isBooted }, set(v) { _isBooted = v; io.emit('var changed', 'booted', v || false); } });
})(global);
declare let isStarted: boolean;
declare let isBooted: boolean;
declare let isPaused: boolean;
let forceCheck = false;

async function start() {
    if (!isStarted && !isBooted) {
        isStarted = true;
        writeFile('***Starting Script***');
        // create
        browser = await chrome.create(['--load-images=yes']);
        tab = await <any>browser.createPage();

        tab.property('viewportSize', {
            width: 1003,
            height: 730
        });
        // set screen var
        await tab.on('onUrlChanged', function(url) {
            let match = url.match(/screen=(\w+)/);
            if (match) {
                screen = match[1];
            }
        });
        // open
        await tab.open('https://die-staemme.de/');
        writeFile('✔ Opened Page');
        // login
        await tab.evaluate(function() {
            document.getElementById('user').value = "MrAboyobam";
            document.getElementById('password').value = "Elcano11";
            document.querySelector('a.btn-login').click();
        });
        writeFile('✔ Logged in');
        // wait for login to be done
        await sleep(2000);
        // select world
        world = 'Welt 162';
        await tab.evaluateJavaScript(`function() {
            var worlds = document.querySelectorAll('a.world-select > span.world_button_active');
            for (var i = 0; i < worlds.length; i++) {
                if (worlds[i].innerText == "${world}") {
                    worlds[i].click();
                }          
            }
        }`);
        
        writeFile('✔ Selected world');
        // wait for world to be loaded
        await sleep(2000);

        tab.render('out.jpg');

        // open main building
        await tab.evaluateJavaScript(`function() {document.querySelector('area[href="${urlOf(false, 'main')}"]').click();}`);
        writeFile('✔ Opened Main Building');
        await sleep(1000);

        isBooted = true;
    }
}

// runtime
async function run() {
    // handle
    let nextCheck: number = 0, lastReason;
    function tick() {
        return new Promise(async resolve => {
            if (!isStarted && !isPaused) {
                await start();
            } else if (isStarted && !isBooted) {
                writeFile('tick triggered without booted server');
                return resolve();
            } else if (isPaused) {
                return resolve();
            }
            recources = await getRecources(tab);
            levels = await levelsOf(tab);
            building = await buildQueue(tab);
            
            io.emit('res', recources);
            io.emit('levels', levels);
            io.emit('building', building);

            if (Date.now() > nextCheck || forceCheck) {
                let checked = await check(tab, queue);
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
        });  
    }
    // tick programm
    (async () => {
        while (true) {
            await tick();
            await sleep(25000);
        }
    })();
}

// start
(async () => await start())();


// util functions
function urlOf(abs: boolean = false, target?: string) {
    return `${abs ? `https://${world}.die-staemme.de` : ''}/game.php?village=${village_id}&screen=${target || screen}`;
}

function writeFile(...content: string[]) {
    io.emit('logs', ...content);
    fs.appendFileSync('out.txt', '\n' + content.join(' '));
}

function kill() {
    return new Promise(async resolve => {
        isStarted = false;
        isBooted = false;
        await sleep(1000);
        await tab.close();
        await browser.exit();
        await sleep(500);
        return resolve();
    });
}