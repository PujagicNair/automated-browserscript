"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function orderPlugins(plugins, used) {
    let neworder = [];
    used.forEach((elem, index) => {
        let requires = plugins[elem].requires;
        if (requires && requires.length) {
            for (let req of requires) {
                if (neworder.indexOf(req) == -1) {
                    neworder.splice(0, 0, req);
                }
            }
        }
        if (neworder.indexOf(elem) == -1) {
            neworder.push(elem);
        }
    });
    return neworder;
}
exports.default = orderPlugins;
