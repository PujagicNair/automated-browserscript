import { Router } from "express";
import { User } from "../Models/user";
import { TribalHackModel } from "./models/MHack";
import { Script } from "./script";
import sleep from "./helpers/sleep";

const SCRIPTS: { [id: string]: Script } = {};

export class TribalHackApi {

    static async setup() {
        // runs all scripts
        let users = await User.find({}).populate('scripts');
        for (let user of users) {
            for (let scm of user.scripts) {
                let script = new Script(scm.config);
                SCRIPTS[scm._id] = script;
                await sleep(500);
                await script.send('setup');
            }
        }
    }

    static handler() {
        let router = Router();

        router.get('/worlddatas', function(req, res) {
            // TODO: make new
            //return res.json({ plugins: TribalHack.PLUGINS, servers: TribalHack.SERVERS });
        });

        router.get('/scripts', async function(req: any, res) {
            let user = await User.findById(req.session.user).populate('scripts');
            let scripts = [];
            for (let script of user.scripts) {
                let fromRuntime = SCRIPTS[script._id];
                let model;
                if (fromRuntime) {
                    model = await fromRuntime.send('deserialize');
                } else {
                    model = script;
                }
                scripts.push(model);
            }
            return res.json(scripts);
        });

        router.post('/create', async function(req: any, res) {
            let script = new Script(req.body);
            SCRIPTS['TODO:'] = script;
            await sleep(500);
            await script.send('setup');
        });

        router.get('/scripts', async function(req: any, res) {
            let user = await User.findById(req.session.user).populate('scripts');
            return res.json(user.scripts);
        });

        router.get('/script/:id', async function(req: any, res) {
            /*let user = await User.findById(req.session.user);
            let fromRuntime = TribalHack.RUNNING[req.params.id];
            let script = fromRuntime ? fromRuntime.deserialize() : await TribalHackModel.findById(req.params.id);
            if (script && user.scripts.indexOf(script._id) != -1) {
                return res.json({ success: true, script });
            } else {
                return res.json({ success: false });
            }*/
        });

        router.post('/widget', async function(req: any, res) {
            /*let scriptID = req.body.scriptID, plugin = req.body.plugin;

            let script = TribalHack.RUNNING[scriptID];
            let user = await User.findById(req.session.user);

            if (user.scripts.indexOf(scriptID) == -1) {
                return res.json({ success: false, message: 'script not assignt to user' });
            }

            if (!script) {
                return res.json({ success: false, message: 'script isnt running' });
            }

            let meta = TribalHack.PLUGINS.find(plug => plug.name == plugin);
            if (!meta) {
                return res.json({ success: false, message: 'widget not found: ' + plugin });
            }

            return res.json({ success: true, content: meta.widget });*/
        });

        router.post('/openpage', async function(req: any, res) {
            /*let user = await User.findById(req.session.user);

            let scriptID = req.body.scriptID, plugin = req.body.plugin;
            
            if (user.scripts.indexOf(scriptID) == -1) {
                return res.json({ success: false, message: 'script not assignt to user' });
            }

            let script = TribalHack.RUNNING[scriptID];
            if (!script) {
                return res.json({ success: false, message: 'script not ready or doesnt exist' });
            }

            let meta = TribalHack.PLUGINS.find(plug => plug.name == plugin);
            if (!meta) {
                return res.json({ success: false, message: 'plugin not found' });
            }

            if (!meta.page) {
                return res.json({ success: false, message: 'plugin doesnt have a page' });
            }

            if (meta.pageControl) {
                let handlers: Function[] = [];
                let input = callback => handlers.push(callback);
                let output = data => TribalHack.pluginOutput(scriptID, plugin, data);
                if (meta.pageControl.pauseTicks) {
                    script.hold();
                }

                let storage = getStorage(scriptID, user._id, plugin);
                runpage = meta.pageControl.server(script, input, output, storage);
                global.sockets[user._id].on('page-' + scriptID + '-' + plugin, function(data) {
                    handlers.forEach(handler => handler(data)); 
                });
            }

            return res.json({ success: true, page: meta.page, runtime: meta.pageControl ? meta.pageControl.client.toString() : '' });*/
        });

        router.post('/closepage', async function(req: any, res) {
            /*let user = await User.findById(req.session.user);

            let scriptID = req.body.scriptID, plugin = req.body.plugin;


            
            if (user.scripts.indexOf(scriptID) == -1) {
                return res.json({ success: false, message: 'script not assignt to user' });
            }

            let script = TribalHack.RUNNING[scriptID];
            if (!script) {
                return res.json({ success: false, message: 'script not ready or doesnt exist' });
            }

            let meta = TribalHack.PLUGINS.find(plug => plug.name == plugin);
            if (!meta) {
                return res.json({ success: false, message: 'plugin not found' });
            }

            if (runpage) {
                runpage();
                runpage = undefined;
            }

            if (meta.pageControl && meta.pageControl.pauseTicks) {
                script.start();
            }
            
            return res.json({});*/
        });

        return router;
    }
}