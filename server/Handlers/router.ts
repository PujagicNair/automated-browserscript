import { Router as CreateRouter } from 'express'
import { TribalHackApi } from '../Browser/TribalHack/api';
import { User } from '../Models/user';

export default class Router {

    static handler() {
        let router = CreateRouter();

        router.post('/login', async function(req: any, res) {
            let user = await User.findOne({ name: req.body.username });
            if (!user) {
                user = new User({ name: req.body.username });
                await user.save();
            }
            req.session.user = user._id;
            
            return res.json({ success: true });
        });

        router.use(async function(req: any, res, next) {
            let user = await User.findOne({ name: 'aboyobam' });
            if (!req.session.user) {
                req.session.user = user._id;
            }
            return next();
        });

        router.get('/logout', (r,s) => {
            delete r['session'].user;
            s.redirect('/');
        });

        router.use('/api', TribalHackApi.handler());

        return router;
    }

}