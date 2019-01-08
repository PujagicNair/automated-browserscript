"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function canIBuild(tab, elem) {
    return tab.evaluateJavaScript(`function() {
        return document.querySelector('[id^=main_buildlink_${elem}]:not([id$=cheap])').style.display != 'none';
    }`);
}
exports.default = canIBuild;
