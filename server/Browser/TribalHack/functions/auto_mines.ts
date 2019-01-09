import { TribalHack } from "../index";
import { HackPluginData } from "../IMeta";


export function run(hack: TribalHack, data: HackPluginData, pluginOptions: any): Promise<void> {
    return new Promise(async resolve => {
        console.log(meta.name, Object.keys(data));
        return resolve();
    });
}

export const meta = {
    name: 'auto-mines',
    description: 'Automaticly update your mines if nothing else is in the building queue, builds the mine with the lowest recources',
    config: {},
    requires: ['recource-amount']
}