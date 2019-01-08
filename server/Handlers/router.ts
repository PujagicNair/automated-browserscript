import { Router as CreateRouter } from 'express'
import { TribalHackApi } from '../Browser/TribalHack/api';

export default class Router {

    static handler() {
        let router = CreateRouter();

        router.post('/login', <any>function(req: { session: any, body: any }, res) {
            req.session.user = req.body.username;
            return res.json({ success: true });
        });

        router.get('/logout', (r,s) => {
            delete r['session'].user;
            s.redirect('/');
        });

        router.use('/api', TribalHackApi.handler());

        return router;
    }

}