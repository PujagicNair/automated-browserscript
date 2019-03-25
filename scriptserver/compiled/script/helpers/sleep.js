"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sleep(ms, value) {
    return new Promise(resolve => {
        return setTimeout(() => {
            return resolve(value);
        }, ms);
    });
}
exports.default = sleep;
