import { Router } from "express";
import { TribalHack } from ".";
import { User } from "../Models/user";
import { TribalHackModel } from "./models/MHack";
import getStorage from "./helpers/get_storage";

let runpage;

export class TribalHackApi {

    static setup() {
        (async () => {
            let scripts = await TribalHackModel.find();
            let users = await User.find({});
            scripts.forEach(async script => {
                let sc = await TribalHack.load(script._id);
                sc.userID = users.find(user => user.scripts.indexOf(sc._id) != -1)._id;
                await sc.setup();
                sc.start();   
            });
        })();
        

        TribalHack.defaultOutput = function(scriptID: string, action: string, data: any) {
            //console.log('default', scriptID, action, data);
            global.io.emit('script-default', scriptID, action, data);
        }

        TribalHack.widgetOutput = function(scriptID: string, plugin: string, data: any) {
            //console.log('widget', scriptID, plugin, data);
            global.io.emit('script-widget', scriptID, plugin, data);
        }

        TribalHack.pluginOutput = function(scriptID: string, plugin: string, data: any) {
            //console.log('plugin', scriptID, plugin, data);
            global.io.emit('script-plugin', scriptID, plugin, data);
        }
    }

    static handler() {
        let router = Router();

        router.get('/worlddatas', function(req, res) {
            return res.json({ plugins: TribalHack.PLUGINS, servers: TribalHack.SERVERS });
        });

        // DUMMY
        router.get('/removescripts', async function(req: any, res) {
            let user = await User.findById(req.session.user);
            user.scripts = [];
            await user.save();
            await TribalHackModel.find().remove().exec();
            return res.redirect('/panel');
        });

        router.get('/scripts', async function(req: any, res) {
            let user = await User.findById(req.session.user);
            let scripts = [];
            for (let script of user.scripts) {
                let fromRuntime = TribalHack.RUNNING[script];
                let model = fromRuntime ? fromRuntime.deserialize() : await TribalHackModel.findById(script);
                scripts.push(model);
            }
            return res.json(scripts);
        });

        router.post('/create', async function(req: any, res) {
            let hack = new TribalHack(req.body);
            try {
                await hack.setup();
                let model = await hack.save();
                let user = await User.findById(req.session.user);
                hack.userID = user._id;
                user.scripts.push(model._id);
                await user.save();
                hack.start();
                return res.json({ success: true });
            } catch (error) {
                await hack.browser.exit();
                return res.json({ success: false, message: error });
            }
        });

        router.get('/scripts', async function(req: any, res) {
            let user = await User.findById(req.session.user).populate('scripts');
            return res.json(user.scripts);
        });

        router.get('/script/:id', async function(req: any, res) {
            let user = await User.findById(req.session.user);
            let fromRuntime = TribalHack.RUNNING[req.params.id];
            let script = fromRuntime ? fromRuntime.deserialize() : await TribalHackModel.findById(req.params.id);
            if (script && user.scripts.indexOf(script._id) != -1) {
                return res.json({ success: true, script });
            } else {
                return res.json({ success: false });
            }
        });

        router.post('/widget', async function(req: any, res) {
            let scriptID = req.body.scriptID, plugin = req.body.plugin;

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

            return res.json({ success: true, content: meta.widget });
        });

        router.post('/openpage', async function(req: any, res) {
            let user = await User.findById(req.session.user);

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

            return res.json({ success: true, page: meta.page, runtime: meta.pageControl ? meta.pageControl.client.toString() : '' });
        });

        router.post('/closepage', async function(req: any, res) {
            let user = await User.findById(req.session.user);

            let scriptID = req.body.scriptID, plugin = req.body.plugin;

            /*if (global.sockets[user._id]) {
                global.sockets[user._id].off('page-' + scriptID + '-' + plugin);
            }*/
            
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
            
            return res.json({});
        });

        return router;
    }
}