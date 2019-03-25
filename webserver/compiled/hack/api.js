"use strict";
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
const express_1 = require("express");
const path = __importStar(require("path"));
const hackmodel_1 = require("./hackmodel");
const hackserver_1 = __importDefault(require("./hackserver"));
const storage_1 = __importDefault(require("./storage"));
const fs = __importStar(require("fs-extra"));
const SERVERS = {};
const PLUGINS = {};
const SOCKET_LISTENERS = {};
class TribalHackApi {
    static async setup() {
        hackmodel_1.createModels();
        let srv = await hackmodel_1.ServerModel.findOne({ name: "local1" });
        if (!srv) {
            new hackmodel_1.ServerModel({
                name: "local1",
                url: "http://localhost:4102",
                integrity: "0xDeadFuckTard"
            }).save();
            console.log('added local script server');
        }
        for (let plugin of fs.readdirSync(path.join(__dirname, 'plugins')).filter(file => fs.lstatSync(path.join(__dirname, 'plugins', file)).isFile())) {
            let meta = await Promise.resolve().then(() => __importStar(require(path.join(__dirname, 'plugins', plugin))));
            PLUGINS[meta.name] = meta;
        }
        let servers = await hackmodel_1.ServerModel.find();
        for (let server of servers) {
            let remote = new hackserver_1.default(server.url, server.integrity);
            remote.change(async (key, value) => {
                global.io.emit('default', { key, value, server: server.name });
                if (key == 'connected' && value === true) {
                    let scripts = await hackmodel_1.ScriptModel.find({ server: server._id });
                    for (let script of scripts) {
                        let status = await remote.query(script._id, 'status');
                        if (status.success) {
                            global.io.emit('default', { key: 'status', scriptID: script._id, data: status.status.value });
                        }
                        else {
                            global.io.emit('default', { key: 'status', scriptID: script._id, data: 'offline' });
                        }
                    }
                }
                else if (key == 'connected' && value === false) {
                    let scripts = await hackmodel_1.ScriptModel.find({ server: server._id });
                    for (let script of scripts) {
                        global.io.emit('default', { key: 'status', scriptID: script._id, data: 'unknown' });
                    }
                }
            });
            (async () => {
                try {
                    await remote.connect();
                    SERVERS[server.name] = remote;
                    let scripts = await hackmodel_1.ScriptModel.find({ server: server._id });
                    for (let script of scripts) {
                        let runtime = remote.runtime(script._id);
                        if (runtime) {
                            TribalHackApi.pipeOutput(script._id, runtime);
                        }
                    }
                }
                catch (error) {
                    console.log("failed to connect to " + server.name + ": " + error);
                }
            })();
        }
    }
    static handler() {
        let router = express_1.Router();
        router.get('/createdata', function (req, res) {
            let plugins = Object.keys(PLUGINS).map(key => ({
                name: PLUGINS[key].name,
                description: PLUGINS[key].description,
                requires: PLUGINS[key].requires,
            }));
            return res.json({ plugins });
        });
        router.get('/scripts', async function (req, res) {
            let scripts = await hackmodel_1.ScriptModel.find({ user: req.session.user }).populate('server');
            let jsonScripts = [];
            for (let script of scripts) {
                let json = await TribalHackApi.getScript(script);
                json.server = script.server.name;
                jsonScripts.push(json);
            }
            return res.json(jsonScripts);
        });
        router.post('/create', async function (req, res) {
            let input = req.body;
            let wordsMap = {
                de161: {
                    map: "161",
                    serverUrl: "die-staemme.de"
                },
                de162: {
                    map: "162",
                    serverUrl: "die-staemme.de"
                }
            };
            let wd = wordsMap[input.serverCode];
            if (!wd) {
                return res.json({ success: false, message: 'unknown map' });
            }
            Object.assign(input, wd);
            input.user = req.session.user;
            let srv = await hackmodel_1.ServerModel.findOne({ name: input.server });
            if (!srv) {
                return res.json({ success: false, message: 'script server not found' });
            }
            input.server = srv._id;
            await new hackmodel_1.ScriptModel(input).save();
            return res.json({ success: true });
        });
        router.post('/start', async function (req, res) {
            let script = await hackmodel_1.ScriptModel.findOne({ _id: req.body.scriptID, user: req.session.user }).populate('server');
            global.io.emit('default', { key: 'status', scriptID: script._id, data: 'booting...' });
            if (script && script.user == req.session.user) {
                let remote = SERVERS[script.server.name];
                if (remote)
                    try {
                        let runtime = await remote.runScript(script._id, script);
                        TribalHackApi.pipeOutput(script._id, runtime);
                        return res.json({ success: true });
                    }
                    catch (error) {
                        return res.json({ success: false, message: script.server.name + ' - failed to run script: ' + error });
                    }
                else {
                    return res.json({ success: false, message: 'script server not found' });
                }
            }
            else {
                return res.json({ success: false, message: 'script not found' });
            }
        });
        router.post('/remove', async function (req, res) {
            let script = await hackmodel_1.ScriptModel.findOne({ _id: req.body.scriptID, user: req.session.user }).populate('server');
            global.io.emit('default', { key: 'status', scriptID: script._id, data: 'removing...' });
            if (script && script.user == req.session.user) {
                await script.remove();
                return res.json({ success: true });
            }
            else {
                return res.json({ success: false, message: 'script not found or does not belong to user' });
            }
        });
        router.get('/script/:id', async function (req, res) {
            let json = await TribalHackApi.getScript(req.params.id);
            if (!json || json.user != req.session.user) {
                return res.json({ success: false, message: 'script is not assignet to user' });
            }
            return res.json({ script: json, success: true });
        });
        router.post('/widget', async function (req, res) {
            let plugin = PLUGINS[req.body.plugin];
            let village = req.body.village;
            if (plugin && plugin.pluginSetup.hasWidget && plugin.widget) {
                let script = await hackmodel_1.ScriptModel.findById(req.body.scriptID).populate('server');
                if (script) {
                    let remote = SERVERS[script.server.name];
                    if (remote && remote.connected) {
                        let lasttick = await remote.query(script._id, 'lasttick');
                        if (lasttick.success) {
                            let data = lasttick.data[village][plugin.name];
                            return res.json({ success: true, content: plugin.widget, data });
                        }
                        else {
                            return res.json(lasttick);
                        }
                    }
                }
                return res.json({ success: true, content: plugin.widget, time: Date.now(), data: {} });
            }
            else {
                return res.json({ success: false, message: 'plugin not found or plugin doesnt have a widget' });
            }
        });
        router.post('/openpage', async function (req, res) {
            let plugin = PLUGINS[req.body.plugin];
            let village = req.body.village;
            if (plugin && plugin.pluginSetup.hasPage && plugin.page) {
                let script = await hackmodel_1.ScriptModel.findById(req.body.scriptID).populate('server');
                if (script) {
                    if (script.user != req.session.user) {
                        return res.json({ success: false, message: 'user doesnt have permissions' });
                    }
                    let remote = SERVERS[script.server.name];
                    if (remote && remote.connected) {
                        try {
                            let socket = global.io.sockets.connected[global.sockets[req.session.user]];
                            if (socket) {
                                let cbFunction = data => {
                                    let runtime = remote.runtime(script._id);
                                    if (runtime) {
                                        runtime.emit(`page-${plugin.name}-${village}`, data);
                                    }
                                };
                                socket.on(`page-${script._id}-${plugin.name}-${village}`, cbFunction);
                                SOCKET_LISTENERS[`page-${script._id}-${plugin.name}-${village}`] = cbFunction;
                                await remote.query(script._id, 'openpage', { plugin: plugin.name, village });
                                return res.json({ success: true, page: plugin.page, runtime: plugin.pageControl.client.toString() });
                            }
                        }
                        catch (error) {
                            return res.json({ success: false, message: error });
                        }
                    }
                    else {
                        return res.json({ success: false, message: 'couldnt reach scriptserver' });
                    }
                }
                else {
                    return res.json({ success: false, message: 'script not found' });
                }
            }
            else {
                return res.json({ success: false, message: 'plugin not found or plugin doesnt have a page' });
            }
        });
        router.post('/closepage', async function (req, res) {
            let plugin = PLUGINS[req.body.plugin];
            let village = req.body.village;
            if (plugin && plugin.pluginSetup.hasPage && plugin.page && village) {
                let script = await hackmodel_1.ScriptModel.findById(req.body.scriptID).populate('server');
                if (script) {
                    if (script.user != req.session.user) {
                        return res.json({ success: false, message: 'user doesnt have permissions' });
                    }
                    let remote = SERVERS[script.server.name];
                    if (remote && remote.connected) {
                        try {
                            await remote.query(script._id, 'closepage', { plugin: plugin.name, village });
                            let socket = global.io.sockets.connected[global.sockets[req.session.user]];
                            if (socket) {
                                let listenerName = `page-${script._id}-${plugin.name}-${village}`;
                                socket.removeListener(listenerName, SOCKET_LISTENERS[listenerName]);
                                return res.json({ success: true });
                            }
                        }
                        catch (error) {
                            return res.json({ success: false, message: error });
                        }
                    }
                    else {
                        return res.json({ success: false, message: 'couldnt reach scriptserver' });
                    }
                }
                else {
                    return res.json({ success: false, message: 'script not found' });
                }
            }
            else {
                return res.json({ success: false, message: 'plugin not found or plugin doesnt have a page' });
            }
        });
        router.post('/kill', async function (req, res) {
            let script = await hackmodel_1.ScriptModel.findById(req.body.scriptID).populate('server');
            if (script) {
                if (script.user != req.session.user) {
                    return res.json({ success: false, message: 'user doesnt have permissions' });
                }
                let remote = SERVERS[script.server.name];
                if (remote && remote.connected) {
                    try {
                        let exit = await remote.query(script._id, 'kill');
                        return res.json(exit);
                    }
                    catch (error) {
                        return res.json({ success: false, message: error });
                    }
                }
                else {
                    return res.json({ success: false, message: 'couldnt reach scriptserver' });
                }
            }
            else {
                return res.json({ success: false, message: 'script not found' });
            }
        });
        return router;
    }
    static getScript(input) {
        return new Promise(async (resolve) => {
            let script;
            if (typeof input == "string") {
                script = await hackmodel_1.ScriptModel.findById(input).populate('server').select(['-password']);
            }
            else {
                script = input;
            }
            if (!script) {
                return resolve(null);
            }
            let json = script.toJSON({ versionKey: false, depopulate: true });
            json.connected = false;
            let remote = SERVERS[script.server.name];
            if (remote && remote.connected) {
                let response = await remote.query(script._id, 'status');
                if (response.success) {
                    json.status = response.status.value;
                }
                else {
                    json.status = 'offline';
                }
                json.connected = true;
                let villages = await remote.query(script._id, 'villages');
                if (villages.success) {
                    json.villages = villages.villages;
                }
            }
            else {
                json.status = 'no connection to the script server';
            }
            delete json.server;
            json.pluginSetup = {};
            for (let plugin of json.plugins) {
                json.pluginSetup[plugin] = PLUGINS[plugin].pluginSetup;
            }
            return resolve(json);
        });
    }
    static pipeOutput(id, runtime) {
        runtime.on('default', output => global.io.emit('default', { scriptID: id, key: output.action, data: output.data }));
        runtime.on('widget', output => global.io.emit('script-widget', id, output.village, output.data));
        runtime.on('plugin', output => {
            global.io.emit('script-plugin', id, output.village, output.plugin, output.data);
        });
        runtime.on('storage', storage_1.default(id, (address, data) => {
            runtime.emit(address, data);
        }));
    }
}
exports.TribalHackApi = TribalHackApi;
