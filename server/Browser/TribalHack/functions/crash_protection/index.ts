import { TribalHack } from "../../index";
import { IMeta } from "../../IMeta";

export function run(hack: TribalHack, pluginOptions: any) {

}

export const meta: IMeta = {
    name: 'auto-crash-handler',
    description: 'Restarts the script if it got crashed',
    config: [
        {
            name: "wait",
            type: "number",
            description: 'second between stopping and restarting the script',
            label: 'wait time'
        }
    ]
}