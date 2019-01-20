import { Router } from 'express';
import { User } from '../Models/user';

export class Auth {

    private constructor() {}

    static handler() {
        global.io.on('connection', async function(socket: any) {
            if (socket.handshake.session.user) {
                let user = await User.findById(socket.handshake.session.user);
                if (user) {
                    global.sockets[user._id] = socket;
                }
            }
        });

        let router = Router();

        router.post('/login', async function(req: any, res) {
            let user = await User.findOne({ name: req.body.username });
            if (!user) {
                user = new User({ name: req.body.username });
                await user.save();
            }
            req.session.user = user._id;
            
            return res.json({ success: true });
        });

        return router;
    }
}