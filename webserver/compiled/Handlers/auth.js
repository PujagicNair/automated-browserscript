"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../user");
class Auth {
    constructor() { }
    static handler() {
        global.io.on('connection', async function (socket) {
            if (socket.handshake['session'].user) {
                global.sockets[socket.handshake['session'].user] = socket.id;
            }
        });
        let router = express_1.Router();
        router.post('/login', async function (req, res) {
            let user = await user_1.User.findOne({ name: req.body.username });
            if (!user) {
                user = new user_1.User({ name: req.body.username });
                await user.save();
            }
            req.session.user = user._id;
            return res.json({ success: true });
        });
        return router;
    }
}
exports.Auth = Auth;
