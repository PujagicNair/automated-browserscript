import { Router } from "express";
import * as fs from 'fs-extra';
import * as path from 'path';
import { TribalHack } from "./index";
import { TribalHackModel } from "./models/MHack";
import { User } from "../../Models/user";

export class TribalHackApi {

    static handler() {
        let router = Router();

        router.get('/worlddatas', function(req, res) {
            return res.json(JSON.parse(fs.readFileSync(path.join(__dirname, 'models', 'data.json')).toString()));
        });

        router.post('/create', async function(req: any, res) {
            try {
                let hack = new TribalHack(req.body, console.log);
                await hack.setup();
                /*await hack.tick();
                await hack.start();*/

                let model = await hack.save();
                let user = await User.findById(req.session.user);
                user.scripts.push(model._id);
                await user.save();
                
            } catch (error) {
                console.log(error);
            }
            return res.json({ success: true });
        });

        router.get('/scripts', async function(req: any, res) {
            let user = await User.findById(req.session.user).populate('scripts');
            return res.json(user.scripts);
        });

        return router;
    }
}