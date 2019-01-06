"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function queueDone(tab) {
    return tab.evaluate(function () {
        var wrap = document.querySelector('#buildqueue tr.nodrag:nth-child(2) span').innerText.split(':');
        var now = Date.now();
        return now + wrap[0] * 3600000 + wrap[1] * 60000 + 61000;
    });
}
exports.default = queueDone;
