import { TribalHack } from "../index";

export function run(hack: TribalHack, pluginOptions: any) {

}

export const meta = {
    name: 'auto-crash-handler',
    description: 'Restarts the script if it got crashed',
    config: {
        wait: { type: "number", description: 'second between stopping and restarting the script' }
    }
}