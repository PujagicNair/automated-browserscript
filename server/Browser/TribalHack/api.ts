import { Router } from "express";
import * as fs from 'fs-extra';

export class TribalHackApi {

    static handler() {
        let router = Router();

        router.get('/worlddatas', function(req, res) {
            return res.json(JSON.parse(fs.readFileSync(__dirname + '\\data.json').toString()));
        });

        router.post('/create', function(req, res) {
            console.log(req.body);
            return res.json({ success: true });
            
        });

        return router;
    }
}