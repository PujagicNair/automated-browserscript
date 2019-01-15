import { IStorage } from "../interfaces";
import { StorageModel } from "../models/MHack";


export default function getStorage(scriptID: string, userID: string): IStorage {
    return {
        get: (key: string, defaultValue?) => {
            return new Promise(async resolve => {
                let item = await StorageModel.findOne({ scriptID, userID, key });
                if (item) {
                    return resolve(item.data.value);
                } else {
                    return resolve(defaultValue);
                }
            });
        },
        set: (key: string, data: any) => {
            return new Promise(async resolve => {
                let exist = await StorageModel.findOne({ scriptID, userID, key });
                if (exist) {
                    exist.data = { value: data };
                    await exist.save();
                } else {
                    await new StorageModel({ key, scriptID, userID, data: { value: data } }).save();
                }
                return resolve();
            });
        }
    }
}