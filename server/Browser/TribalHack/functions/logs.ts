import { TribalHack } from "../index";
import { IMeta, HackPluginData } from "../IMeta";

export function run(hack: TribalHack, data: HackPluginData, pluginOptions: any): Promise<void> {
    return new Promise(async resolve => {
        console.log(meta.name, Object.keys(data));
        return resolve();
    });
}

export const meta: IMeta = {
    name: 'logs',
    description: 'You see the output of the script in your browser',
    config: {}
}