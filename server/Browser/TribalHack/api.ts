import { Router } from "express";
import * as fs from 'fs-extra';
import { TribalHack } from "./index";

export class TribalHackApi {

    static handler() {
        let router = Router();

        router.get('/worlddatas', function(req, res) {
            return res.json(JSON.parse(fs.readFileSync(__dirname + '\\data.json').toString()));
        });

        router.post('/create', async function(req, res) {
            let hack = new TribalHack(req.body, console.log);
            try {
                await hack.setup();
                await hack.tick();
                await hack.start();
            } catch (error) {
                console.log(error);
            }
            return res.json({ success: true });
            
        });

        return router;
    }
}