import { StorageModel } from "./hackmodel";

export default function storage(scriptID: string, response: (address: string, data?: any) => void) {
    return async function(data) {
        if (data.method == 'get') {
            let out = await StorageModel.findOne({ key: data.key, scriptID, plugin: data.plugin });
            if (out) {
                return response(data.responseAddr, out.data.value);
            } else {
                return response(data.responseAddr, data.defaultValue);
            }
        } else if (data.method == 'set') {
            let out = await StorageModel.findOne({ key: data.key, scriptID, plugin: data.plugin });
            if (out) {
                out.data = { value: data.value };
                await out.save();   
            } else {
                let model = new StorageModel({ key: data.key, scriptID, plugin: data.plugin, data: { value: data.value } });
                await model.save();
            }
            return response(data.responseAddr);
        }
    }
}