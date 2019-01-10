import { Router } from "express";
import { TribalHack } from "./index";
import { User } from "../../Models/user";
import { TribalHackModel } from "./models/MHack";

function output(action: string, target: string, result: string) {
    console.log(action, target, result);
    //io.emit(action, target, result);
}

export class TribalHackApi {

    static setup() {
        global.io.on('connection', socket => {
    
        });
    }

    static handler() {
        let router = Router();

        router.get('/worlddatas', function(req, res) {
            return res.json({ plugins: TribalHack.PLUGINS, servers: TribalHack.SERVERS });
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
            let hack = new TribalHack(req.body, output);
            try {
                await hack.setup();
                let model = await hack.save();
                let user = await User.findById(req.session.user);
                user.scripts.push(model._id);
                await user.save();

                TribalHack.RUNNING[hack._id] = hack;
                
                return res.json({ success: true, message: 'ready to lunch' });
            } catch (error) {
                await hack.browser.exit();
                return res.json({ success: false, message: error });
            }
            return res.json({ message: 'test' })
            
        });

        router.get('/scripts', async function(req: any, res) {
            let user = await User.findById(req.session.user).populate('scripts');
            return res.json(user.scripts);
        });

        return router;
    }
}