"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function build(tab, elem) {
    return tab.evaluateJavaScript(`function() {
        document.querySelector('[id^=main_buildlink_${elem}]:not([id$=cheap])').click();
    }`);
}
exports.default = build;
