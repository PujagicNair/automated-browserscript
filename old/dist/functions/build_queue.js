"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function buildQueue(tab) {
    return tab.evaluate(function () {
        var holders = document.querySelectorAll('#buildqueue tr img');
        var names = [];
        for (var i = 0; i < holders.length; i++) {
            names.push(holders[i].parentElement.innerText);
        }
        return names;
    });
}
exports.default = buildQueue;
