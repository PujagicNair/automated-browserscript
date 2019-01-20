import { Router } from "express";
import { User } from "../user";
import { ScriptModel, createModels, ServerModel } from "./hackmodel";
import HackServer from "./hackserver";
import storage from "./storage";

const SERVERS: { [name: string]: HackServer } = {};

export class TribalHackApi {

    static async setup() {

        createModels();

        let servers = await ServerModel.find();
        for (let server of servers) {
            let remote = new HackServer(server.url, server.integrity);
            try {
                await remote.connect();
                SERVERS[server.name] = remote;
            } catch (error) {
                console.log('failed to build a remote connection to', server.name, 'reason:', error);
            }
        }

        let scripts = await ScriptModel.find().populate('server');
        for (let script of scripts) {
            let server = SERVERS[script.server.name];
            try {
                let runtime = await server.runScript(script._id, script);
                runtime.on('default', output => global.io.emit('script-default', script._id, output.action, output.data));
                runtime.on('widget', output => global.io.emit('script-widget', script._id, output.plugin, output.data));
                runtime.on('plugin', output => global.io.emit('script-plugin', script._id, output.plugin, output.data));
                runtime.on('storage', storage(script._id, (address, data) => runtime.emit(address, data)));
            } catch (error) {
                console.log('failed to run script:', error);
            }
        }
    }

    static handler() {
        let router = Router();

        router.get('/worlds', function(req, res) {
            return res.json(["161", "162", "163"]);
        });

        router.get('/scripts', async function(req: any, res) {
            let scripts = await ScriptModel.find({ user: req.session.user });
            return res.json(scripts);
        });

        router.post('/create', async function(req: any, res) {
            // check body
            // create script
        });

        router.get('/script/:id', async function(req: any, res) {
            let scriptID = req.params.id;
            let script = await ScriptModel.findById(scriptID).populate('server').select(['-password', '-user']);
            if (!script || script.user != req.session.user) {
                return res.json({ success: false, message: 'script is not assignet to user' });
            }
            let json = script.toJSON({ versionKey: false, depopulate: true });

            if (SERVERS[script.server.name]) {
                let response = JSON.parse(await SERVERS[script.server.name].query(script._id, 'status'));
                if (response.success) {
                    json.status = response.status.value;
                } else {
                    json.status = 'unknown';
                }
            } else {
                json.status = 'offline';
            }
            delete json.server;
            return res.json(json);
        });

        router.post('/widget', async function(req: any, res) {
            // get widget
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