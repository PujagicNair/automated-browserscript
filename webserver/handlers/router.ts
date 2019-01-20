import { Router as CreateRouter } from 'express'
import { TribalHackApi } from '../hack/api';

export default class Router {

    static handler() {
        let router = CreateRouter();

        router.get('/logout', (req: any, res) => {
            delete req.session.user;
            return res.redirect('/');
        });

        function authOnly(fn: string, ...args: any[]) {
            return async function(req, res, next) {
                if (req.session.user) {
                    return next();
                } else {
                    return res[fn](...args);
                }
            }
        }

        router.use('/panel', authOnly('redirect', '/'));
        router.use('/api', authOnly('json', { success: false, message: 'not logged in' }), TribalHackApi.handler());

        return router;
    }

}