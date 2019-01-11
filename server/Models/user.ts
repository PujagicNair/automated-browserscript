import { Document, Model, Connection, Schema } from "mongoose";


export var User: MUserStatic;

export function createUserModel(conn: Connection) {

    let SUser = new Schema({
        name: String,
        scripts: {
            type: [Schema.Types.ObjectId],
            ref: 'scripts',
            default: []
        }
    });

    User = conn.model<MUser, any>('user', SUser);
}

interface IUser {
    name: string;
    scripts: any[];
}

interface MUser extends Document, IUser {

}

interface MUserStatic extends Model<MUser, MUser[]> {

}