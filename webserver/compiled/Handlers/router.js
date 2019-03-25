"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_1 = require("../hack/api");
class Router {
    static handler() {
        let router = express_1.Router();
        router.get('/logout', (req, res) => {
            delete req.session.user;
            return res.redirect('/');
        });
        function authOnly(fn, ...args) {
            return async function (req, res, next) {
                if (req.session.user) {
                    return next();
                }
                else {
                    return res[fn](...args);
                }
            };
        }
        router.use('/panel', authOnly('redirect', '/'));
        router.use('/api', authOnly('json', { success: false, message: 'not logged in' }), api_1.TribalHackApi.handler());
        return router;
    }
}
exports.default = Router;
