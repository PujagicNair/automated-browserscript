import { Document, Model, Schema } from "mongoose";


export var User: MUserStatic;

export function createUserModel() {

    let SUser = new Schema({
        name: String,
        scripts: {
            type: [Schema.Types.ObjectId],
            ref: 'scripts',
            default: []
        }
    });

    User = global.connection.model('user', SUser);
}

interface IUser {
    name: string;
    scripts: any[];
}

interface MUser extends Document, IUser {

}

interface MUserStatic extends Model<MUser, MUser[]> {

}