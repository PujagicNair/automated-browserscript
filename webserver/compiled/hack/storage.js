"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hackmodel_1 = require("./hackmodel");
function storage(scriptID, response) {
    return async function (data) {
        if (data.method == 'get') {
            let out = await hackmodel_1.StorageModel.findOne({ key: data.key, scriptID, plugin: data.plugin, villageID: data.villageID });
            if (out) {
                return response(data.responseAddr, out.data.value);
            }
            else {
                return response(data.responseAddr, data.defaultValue);
            }
        }
        else if (data.method == 'set') {
            let out = await hackmodel_1.StorageModel.findOne({ key: data.key, scriptID, plugin: data.plugin, villageID: data.villageID });
            if (out) {
                out.data = { value: data.value };
                await out.save();
            }
            else {
                let model = new hackmodel_1.StorageModel({ key: data.key, scriptID, plugin: data.plugin, villageID: data.villageID, data: { value: data.value } });
                await model.save();
            }
            return response(data.responseAddr);
        }
        else if (data.method == 'push') {
            let out = await hackmodel_1.StorageModel.findOne({ key: data.key, scriptID, plugin: data.plugin, villageID: data.villageID });
            if (out) {
                let value = out.data.value;
                value.push(data.value);
                out.data = { value };
                await out.save();
            }
            else {
                let model = new hackmodel_1.StorageModel({ key: data.key, scriptID, plugin: data.plugin, villageID: data.villageID, data: { value: [data.value] } });
                await model.save();
            }
            return response(data.responseAddr);
        }
        else if (data.method == 'remove') {
            await hackmodel_1.StorageModel.findOneAndDelete({ key: data.key, scriptID, plugin: data.plugin, villageID: data.villageID });
            return response(data.responseAddr);
        }
    };
}
exports.default = storage;
