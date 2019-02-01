import { Router } from "express";
import * as path from 'path';
import { ScriptModel, createModels, ServerModel, MTribalHackDocument } from "./hackmodel";
import HackServer from "./hackserver";
import storage from "./storage";
import { IPlugin } from "./interfaces";
import * as fs from "fs-extra";

const SERVERS: { [name: string]: HackServer } = {};
const PLUGINS: { [name: string]: IPlugin } = {};
const SOCKET_LISTENERS: { [name: string]: any } = {};

export class TribalHackApi {

    static async setup() {

        createModels();

        let srv = await ServerModel.findOne({ name: "local1" });
        if (!srv) {
            new ServerModel({
                name: "local1",
                url: "http://localhost:4102",
                integrity: "0xDeadFuckTard"
            }).save();
            console.log('added local script server');
        }

        for (let plugin of fs.readdirSync(path.join(__dirname, 'plugins'))) {
            let meta: IPlugin = await import(path.join(__dirname, 'plugins', plugin));
            PLUGINS[meta.name] = meta;
        }

        let servers = await ServerModel.find();
        for (let server of servers) {
            let remote = new HackServer(server.url, server.integrity);
            remote.change(async (key, value) => {
                global.io.emit('default', { key, value, server: server.name });
                if (key == 'connected' && value === true) {
                    let scripts = await ScriptModel.find({ server: server._id });
                    for (let script of scripts) {
                        let status = await remote.query(script._id, 'status');
                        if (status.success) {
                            global.io.emit('default', { key: 'status', scriptID: script._id, data: status.status.value });
                        } else {
                            global.io.emit('default', { key: 'status', scriptID: script._id, data: 'offline' });
                        }
                    }
                } else if (key == 'connected' && value === false) {
                    let scripts = await ScriptModel.find({ server: server._id });
                    for (let script of scripts) {
                        global.io.emit('default', { key: 'status', scriptID: script._id, data: 'unknown' });
                    }
                }
            });
            (async () => {
                try {
                    await remote.connect();
                    SERVERS[server.name] = remote;
                    let scripts = await ScriptModel.find({ server: server._id });
                    for (let script of scripts) {
                        let runtime = remote.runtime(script._id);
                        if (runtime) {
                            TribalHackApi.pipeOutput(script._id, runtime);
                        }
                    }
                } catch (error) {
                    console.log("failed to connect to " + server.name + ": " + error);
                }
            })();
        }
    }

    static handler() {
        let router = Router();

        router.get('/worlds', function(req, res) {
            return res.json(["161", "162", "163"]);
        });

        router.get('/scripts', async function(req: any, res) {
            let scripts = await ScriptModel.find({ user: req.session.user }).populate('server');
            let jsonScripts = [];
            for (let script of scripts) {
                let json = await TribalHackApi.getScript(script);
                json.server = script.server.name;
                jsonScripts.push(json);
            }
            return res.json(jsonScripts);
        });

        router.post('/create', async function(req: any, res) {
            let input = req.body;
            input.user = req.session.user;
            input.server = (await ServerModel.findOne({ name: input.server }))._id;
            input.plugins = input.plugins.split('\n').map(plug => plug.trim());
            
            await new ScriptModel(input).save();
            return res.json({})
        });

        router.post('/start', async function(req: any, res) {
            let script = await ScriptModel.findOne({ _id: req.body.scriptID, user: req.session.user }).populate('server');
            global.io.emit('default', { key: 'status', scriptID: script._id, data: 'preparing to boot' });
            if (script) {   
                let remote = SERVERS[script.server.name];
                if (remote) try {
                    let runtime = await remote.runScript(script._id, script);
                    TribalHackApi.pipeOutput(script._id, runtime);
                    return res.json({ success: true });
                } catch (error) {
                    return res.json({ success: false, message: script.server.name + ' - failed to run script: ' + error });
                } else {
                    return res.json({ success: false, message: 'script server not found' });
                }
            } else {
                return res.json({ success: false, message: 'script not found' });
            }
        });

        router.get('/script/:id', async function(req: any, res) {
            let json = await TribalHackApi.getScript(req.params.id);
            if (!json || json.user != req.session.user) {
                return res.json({ success: false, message: 'script is not assignet to user' });
            }
            return res.json({ script: json, success: true });
        });

        router.post('/widget', async function(req: any, res) {
            let plugin = PLUGINS[req.body.plugin];
            let village = req.body.village;
            if (plugin && plugin.pluginSetup.hasWidget && plugin.widget) {
                let script = await ScriptModel.findById(req.body.scriptID).populate('server');
                if (script) {
                    let remote = SERVERS[script.server.name];
                    if (remote && remote.connected) {
                        let lasttick = await remote.query(script._id, 'lasttick');
                        if (lasttick.success) {
                            let data = lasttick.data.value[village][plugin.name];
                            return res.json({ success: true, content: plugin.widget, data, time: lasttick.data.time });
                        } else {
                            return res.json(lasttick);
                        }
                    }
                }
                return res.json({ success: true, content: plugin.widget, time: Date.now(), data: {} });
            } else {
                return res.json({ success: false, message: 'plugin not found or plugin doesnt have a widget' });
            }
        });

        router.post('/openpage', async function(req: any, res) {
            let plugin = PLUGINS[req.body.plugin];
            let village = req.body.village;
            if (plugin && plugin.pluginSetup.hasPage && plugin.page) {
                let script = await ScriptModel.findById(req.body.scriptID).populate('server');
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
                                }
                                
                                socket.on(`page-${script._id}-${plugin.name}-${village}`, cbFunction);
                                SOCKET_LISTENERS[`page-${script._id}-${plugin.name}-${village}`] = cbFunction;

                                await remote.query(script._id, 'openpage', { plugin: plugin.name, village });
                                return res.json({ success: true, page: plugin.page, runtime: plugin.pageControl.client.toString() });
                            }
                        } catch (error) {
                            return res.json({ success: false, message: error });
                        }
                    } else {
                        return res.json({ success: false, message: 'couldnt reach scriptserver' });
                    }
                } else {
                    return res.json({ success: false, message: 'script not found' });
                }
            } else {
                return res.json({ success: false, message: 'plugin not found or plugin doesnt have a page' });
            }
            
        });

        router.post('/closepage', async function(req: any, res) {
            let plugin = PLUGINS[req.body.plugin];
            let village = req.body.village;

            if (plugin && plugin.pluginSetup.hasPage && plugin.page && village) {
                let script = await ScriptModel.findById(req.body.scriptID).populate('server');
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
                        } catch (error) {
                            return res.json({ success: false, message: error });
                        }
                    } else {
                        return res.json({ success: false, message: 'couldnt reach scriptserver' });
                    }
                } else {
                    return res.json({ success: false, message: 'script not found' });
                }
            } else {
                return res.json({ success: false, message: 'plugin not found or plugin doesnt have a page' });
            }
        });

        router.post('/kill', async function(req: any, res) {
            let script = await ScriptModel.findById(req.body.scriptID).populate('server');
            if (script) {
                if (script.user != req.session.user) {
                    return res.json({ success: false, message: 'user doesnt have permissions' });
                }
                let remote = SERVERS[script.server.name];
                if (remote && remote.connected) {
                    try {
                        let exit = await remote.query(script._id, 'kill');
                        return res.json(exit);
                    } catch (error) {
                        return res.json({ success: false, message: error });
                    }
                } else {
                    return res.json({ success: false, message: 'couldnt reach scriptserver' });
                }
            } else {
                return res.json({ success: false, message: 'script not found' });
            }
        });

        return router;
    }

    private static getScript(id: string)
    private static getScript(document: MTribalHackDocument)
    private static getScript(input: string | MTribalHackDocument) {
        return new Promise<any>(async resolve => {
            let script: MTribalHackDocument;
            if (typeof input == "string") {
                script = await ScriptModel.findById(input).populate('server').select(['-password']);
            } else {
                script = input;
            }
            let json = script.toJSON({ versionKey: false, depopulate: true });

            // self props
            json.connected = false;
            
            let remote = SERVERS[script.server.name];
            if (remote && remote.connected) {
                let response = await remote.query(script._id, 'status');
                if (response.success) {
                    json.status = response.status.value;
                } else {
                    json.status = 'offline';
                }
                json.connected = true;
                let villages = await remote.query(script._id, 'villages');
                if (villages.success) {
                    json.villages = villages.villages;
                }
            } else {
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

    private static pipeOutput(id: string, runtime) {
        runtime.on('default', output => global.io.emit('default', { scriptID: id, key: output.action, data: output.data }));
        runtime.on('widget', output => global.io.emit('script-widget', id, output.village, output.data));
        runtime.on('plugin', output => {
            global.io.emit('script-plugin', id, output.village, output.plugin, output.data);
        });
        runtime.on('storage', storage(id, (address, data) => {
            runtime.emit(address, data);
        }));
    }
}