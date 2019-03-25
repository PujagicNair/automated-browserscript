"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
function createModels() {
    let STribalHack = new mongoose_1.Schema({
        serverUrl: String,
        serverCode: String,
        map: String,
        username: String,
        password: String,
        plugins: [String],
        server: { type: mongoose_1.Schema.Types.ObjectId, ref: 'server' },
        user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'user' }
    });
    let SStorage = new mongoose_1.Schema({
        key: String,
        scriptID: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'scripts'
        },
        data: mongoose_1.Schema.Types.Mixed,
        villageID: String,
        plugin: String
    });
    let SServer = new mongoose_1.Schema({
        name: String,
        url: String,
        integrity: String
    });
    exports.ScriptModel = global.connection.model('script', STribalHack);
    exports.StorageModel = global.connection.model('storage', SStorage);
    exports.ServerModel = global.connection.model('server', SServer);
}
exports.createModels = createModels;
