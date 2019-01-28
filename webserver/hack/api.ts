import { Router } from "express";
import * as path from 'path';
import { ScriptModel, createModels, ServerModel, MTribalHackDocument } from "./hackmodel";
import HackServer from "./hackserver";
import storage from "./storage";
import { IPlugin } from "./interfaces";
import * as fs from "fs-extra";

const SERVERS: { [name: string]: HackServer } = {};
let PLUGINS: { [name: string]: IPlugin } = {};

export class TribalHackApi {

    static async setup() {

        createModels();

        for (let plugin of fs.readdirSync(path.join(__dirname, 'plugins'))) {
            let meta: IPlugin = await import(path.join(__dirname, 'plugins', plugin));
            PLUGINS[meta.name] = meta;
        }

        let servers = await ServerModel.find();
        for (let server of servers) {
            let remote = new HackServer(server.url, server.integrity);
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
            // check body
            // create script
        });

        router.post('/start', async function(req: any, res) {
            let script = await ScriptModel.findOne({ _id: req.body.scriptID, user: req.session.user }).populate('server');
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
            if (plugin && plugin.pluginSetup.hasWidget && plugin.widget) {
                let script = await ScriptModel.findById(req.body.scriptID).populate('server');
                if (script) {
                    let remote = SERVERS[script.server.name];
                    if (remote && remote.connected) {
                        let lasttick = await remote.query(script._id, 'lasttick');
                        if (lasttick.success) {
                            let data = lasttick.data.value[plugin.name];
                            return res.json({ success: true, content: plugin.widget, data, time: lasttick.data.time });
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
                                socket.on(`page-${script._id}-${plugin.name}`, (data) => {
                                    let runtime = remote.runtime(script._id);
                                    if (runtime) {
                                        runtime.emit(`page-${plugin.name}`, data);
                                    }
                                });
                                await remote.query(script._id, 'openpage', { plugin: plugin.name });
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
            if (plugin && plugin.pluginSetup.hasPage && plugin.page) {
                let script = await ScriptModel.findById(req.body.scriptID).populate('server');
                if (script) {
                    if (script.user != req.session.user) {
                        return res.json({ success: false, message: 'user doesnt have permissions' });
                    }
                    let remote = SERVERS[script.server.name];
                    if (remote && remote.connected) {
                        try {
                            await remote.query(script._id, 'closepage', { plugin: plugin.name });
                            let socket = global.io.sockets.connected[global.sockets[req.session.user]];
                            if (socket) {
                                socket.off(`page-${script._id}-${plugin.name}`);
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
            json.canStart = false;
            json.canPause = false;
            
            let remote = SERVERS[script.server.name];
            if (remote && remote.connected) {
                let response = await remote.query(script._id, 'status');
                if (response.success) {
                    json.status = response.status.value;
                    json.canTerminate = true;
                    json.canPause = json.status == 'running';
                } else {
                    json.status = 'unknown';
                    json.canStart = true;
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
        runtime.on('default', output => global.io.emit('script-default', id, output.action, output.data));
        runtime.on('widget', output => global.io.emit('script-widget', id, output.village, output.data));
        runtime.on('plugin', output => global.io.emit('script-plugin', id, output.plugin, output.data));
        runtime.on('storage', storage(id, (address, data) => {
            runtime.emit(address, data);
        }));
    }
}