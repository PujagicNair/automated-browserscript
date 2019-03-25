"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function providePluginsFor(data, plugins = []) {
    //return data;
    let end = {};
    for (let plugin of plugins) {
        end[plugin] = data[plugin];
    }
    return end;
}
exports.default = providePluginsFor;
