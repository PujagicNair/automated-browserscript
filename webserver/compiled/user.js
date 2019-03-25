"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
function createUserModel() {
    let SUser = new mongoose_1.Schema({
        name: String
    });
    exports.User = global.connection.model('user', SUser);
}
exports.createUserModel = createUserModel;
