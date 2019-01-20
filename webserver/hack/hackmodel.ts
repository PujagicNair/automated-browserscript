import { Document, Model, Schema } from 'mongoose';

export var ScriptModel: ITribalHackModelStatic;
export var StorageModel: MStorageStatic;
export var ServerModel: MServerStatic;

export function createModels() {
    let STribalHack = new Schema({
        serverUrl: String,
        serverCode: String,
        map: String,
        username: String,
        password: String,
        plugins: [String],
        server: { type: Schema.Types.ObjectId, ref: 'server' },
        user: { type: Schema.Types.ObjectId, ref: 'user' }
    });

    let SStorage = new Schema({
        key: String,
        scriptID: {
            type: Schema.Types.ObjectId,
            ref: 'scripts'
        },
        data: Schema.Types.Mixed,
        plugin: String
    });

    let SServer = new Schema({
        name: String,
        url: String,
        integrity: String
    });

    ScriptModel = global.connection.model('script', STribalHack);
    StorageModel = global.connection.model('storage', SStorage);
    ServerModel = global.connection.model('server', SServer);
}

interface ITribalHackModel {
    serverUrl: string;
    serverCode: string;
    map: string;
    username: string;
    password: string;
    plugins: string[];
    server: IServer;
    user: string;
}
export interface MTribalHackDocument extends Document, ITribalHackModel {

}
interface ITribalHackModelStatic extends Model<MTribalHackDocument, MTribalHackDocument[]> {

}

interface IStorage {
    scriptID: string;
    data: any;
    plugin: string;
}

interface MStorage extends Document, IStorage {

}

interface MStorageStatic extends Model<MStorage, MStorage[]> {

}

interface IServer {
    name: string;
    url: string;
    integrity: string;
}

interface MServer extends Document, IServer {

}

interface MServerStatic extends Model<MServer, MServer[]> {

}