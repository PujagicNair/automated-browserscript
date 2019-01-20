import { Document, Model, Schema } from 'mongoose';

export var TribalHackModel: ITribalHackModelStatic;
export var StorageModel: MStorageStatic;

export function createModels() {
    let STribalHack = new Schema({
        server: Schema.Types.Mixed,
        plugins: [String],
        config: Schema.Types.Mixed,
        villageId: String,
        pluginSetup: {
            type: Schema.Types.Mixed,
            default: {}
        },
    });

    let SStorage = new Schema({
        key: String,
        userID: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        scriptID: {
            type: Schema.Types.ObjectId,
            ref: 'scripts'
        },
        data: Schema.Types.Mixed,
        plugin: String
    });

    TribalHackModel = global.connection.model('script', STribalHack);
    StorageModel = global.connection.model('storage', SStorage);
}

interface ITribalHackModel {
    isRunning: boolean;
    running: boolean;
    config: any;
}
export interface MTribalHackDocument extends Document, ITribalHackModel {

}
interface ITribalHackModelStatic extends Model<MTribalHackDocument, MTribalHackDocument[]> {

}

interface IStorage {
    scriptID: string;
    userID: string;
    data: any;
    plugin: string;
}

interface MStorage extends Document, IStorage {

}

interface MStorageStatic extends Model<MStorage, MStorage[]> {

}