import { Router } from 'express';
import { User } from '../user';

export class Auth {

    private constructor() {}

    static handler() {
        global.io.on('connection', async function(socket) {
            if (socket.handshake.session.user) {
                global.sockets[socket.handshake.session.user] = socket.id;
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