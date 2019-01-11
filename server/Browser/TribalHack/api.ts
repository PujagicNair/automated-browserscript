import { Router } from "express";
import { TribalHack } from "./index";
import { User } from "../../Models/user";
import { TribalHackModel } from "./models/MHack";

export class TribalHackApi {

    static setup() {
        setTimeout(async () => {
            let scripts = await TribalHackModel.find();
            
            scripts.forEach(async script => {
                let sc = await TribalHack.load(script._id);
                await sc.setup();
                sc.start();
            });
        }, 5000);


        TribalHack.defaultOutput = function(scriptID: string, action: string, data: any) {
            console.log('default', scriptID, action, data);
            global.io.emit('script-default', scriptID, action, data);
        }

        TribalHack.widgetOutput = function(scriptID: string, plugin: string, data: any) {
            console.log('widget', scriptID, plugin, data);
            global.io.emit('script-widget', scriptID, plugin, data);
        }

        TribalHack.pluginOutput = function(scriptID: string, plugin: string, data: any) {
            console.log('plugin', scriptID, plugin, data);
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
                user.scripts.push(model._id);
                await user.save();
                hack.start();
                return res.json({ success: true, message: 'ready to lunch' });
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
            console.log('got script from', fromRuntime ? 'runtime' : 'db');
            
            let script = fromRuntime ? fromRuntime.deserialize() : await TribalHackModel.findById(req.params.id);

            if (script && user.scripts.indexOf(script._id) != -1) {
                return res.json({ success: true, script });
            } else {
                return res.json({ success: false });
            }
        })

        return router;
    }
}