import { Document, Model, Connection, Schema } from 'mongoose';

export var TribalHackModel: ITribalHackModelStatic;
export function createModels(conn: Connection) {
    let STribalHack = new Schema({
        server: Schema.Types.Mixed,
        plugins: [String],
        config: Schema.Types.Mixed,
        villageId: String
    });

    TribalHackModel = conn.model<any, any>('tribal_hack', STribalHack);
}

interface ITribalHackModel {

}
export interface MTribalHackDocument extends Document, ITribalHackModel {

}
interface ITribalHackModelStatic extends Model<MTribalHackDocument, MTribalHackDocument[]> {

}