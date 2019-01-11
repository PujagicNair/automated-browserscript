import { Document, Model, Connection, Schema } from 'mongoose';

export var TribalHackModel: ITribalHackModelStatic;
export function createModels(conn: Connection) {
    let STribalHack = new Schema({
        server: Schema.Types.Mixed,
        plugins: [String],
        config: Schema.Types.Mixed,
        villageId: String,
        pluginSetup: {
            type: Schema.Types.Mixed,
            default: {}
        }
    });

    TribalHackModel = conn.model<any, any>('script', STribalHack);
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