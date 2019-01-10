import { TribalHack } from "../../index";
import { IMeta } from "../../IMeta";

export function run(hack: TribalHack, reqData: any): Promise<any> {
    return new Promise(async resolve => {
        return resolve();
    });
}

export const meta: IMeta = {
    name: 'logs',
    description: 'You see the output of the script in your browser',
    config: [],
    requires: ['switch-screen', 'screen']
}