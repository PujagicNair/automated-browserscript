import { TribalHack } from "../../index";
import { IMeta } from "../../IMeta";

export function run(hack: TribalHack, pluginOptions: any) {
    return new Promise(async resolve => {
        return resolve(hack.browser.url.match(/screen=(\w+)/)[1]);
    });
}

export const meta: IMeta = {
    name: 'screen',
    description: 'Allows the script to navigate',
    config: []
}