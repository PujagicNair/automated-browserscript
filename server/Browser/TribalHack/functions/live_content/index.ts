import { TribalHack } from "../../index";
import { IMeta } from "../../IMeta";

export function run(hack: TribalHack, reqData: any, pluginOptions: any) {
    console.log("live content", reqData);
    
}

export const meta: IMeta = {
    name: 'live-content',
    description: 'You can view your village live inside your browser and interacti with it',
    config: [],
    requires: ['logs']
}