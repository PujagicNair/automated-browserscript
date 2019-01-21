import { Router } from "express";
import * as path from 'path';
import { ScriptModel, createModels, ServerModel } from "./hackmodel";
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
                    console.log('connected to:', server.name);
                    
                    SERVERS[server.name] = remote;
                    let scripts = await ScriptModel.find({ server: server._id });
                    for (let script of scripts) {
                        try {
                            let runtime = await remote.runScript(script._id, script);
                            runtime.on('widget', output => global.io.emit('script-widget', script._id, output.plugin, output.data));
                            runtime.on('plugin', output => global.io.emit('script-plugin', script._id, output.plugin, output.data));
                            runtime.on('storage', storage(script._id, (address, data) => runtime.emit(address, data)));
                        } catch (error) {
                            console.log(server.name + ' - failed to run script:', error);
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
                let json = script.toJSON({ versionKey: false, depopulate: true });
                let remote = SERVERS[script.server.name];
                if (remote && remote.connected) {
                    let response = await remote.query(script._id, 'status');
                    if (response.success) {
                        json.status = response.status.value;
                    } else {
                        json.status = 'unknown';
                    }
                } else {
                    json.status = 'no connection to the script server';
                }
                json.server = script.server.name;
                jsonScripts.push(json);
            }
            return res.json(jsonScripts);
        });

        router.post('/create', async function(req: any, res) {
            // check body
            // create script
        });

        router.get('/script/:id', async function(req: any, res) {
            let scriptID = req.params.id;
            let script = await ScriptModel.findById(scriptID).populate('server').select(['-password']);
            if (!script || script.user != req.session.user) {
                return res.json({ success: false, message: 'script is not assignet to user' });
            }
            let json = script.toJSON({ versionKey: false, depopulate: true });
            let remote = SERVERS[script.server.name];
            if (remote && remote.connected) {
                let response = await remote.query(script._id, 'status');
                if (response.success) {
                    json.status = response.status.value;
                } else {
                    json.status = 'unknown';
                }
            } else {
                json.status = 'no connection to the script server';
            }
            delete json.server;
            json.pluginSetup = {};
            for (let plugin of json.plugins) {
                json.pluginSetup[plugin] = PLUGINS[plugin].pluginSetup;
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
            // get page & pageControl
        });

        router.post('/closepage', async function(req: any, res) {
            // close runtime
        });

        return router;
    }
}