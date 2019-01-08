"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function levelsOf(tab) {
    return tab.evaluate(function () {
        var hr = document.querySelectorAll('[id^=main_buildrow]');
        var list = [];
        for (var i = 0; i < hr.length; i++) {
            list.push('<b>[' + hr[i].id.match(/main_buildrow_(.+?)$/)[1] + ']</b> ' + hr[i].querySelector(':nth-child(2)').innerHTML + " - " + hr[i].querySelector('span').innerText);
        }
        return list;
    });
}
exports.default = levelsOf;
