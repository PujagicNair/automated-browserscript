"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function hasAllRequired(data, required) {
    return !required.some(plugin => !data[plugin]);
}
exports.default = hasAllRequired;
