import { TribalHack } from "../index";
import { IMeta } from "../IMeta";

export function run(hack: TribalHack, pluginOptions: any) {

}

export const meta: IMeta = {
    name: 'status-check-plugin',
    description: 'Adds the output of the check plugin to the status section',
    config: {},
    requires: ['script-status', 'build-checks']
}