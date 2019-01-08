"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getRecources(tab) {
    return tab.evaluate(function () {
        return {
            "wood": Number(document.getElementById('wood').innerText),
            "stone": Number(document.getElementById('stone').innerText),
            "iron": Number(document.getElementById('iron').innerText)
        };
    });
}
exports.default = getRecources;
