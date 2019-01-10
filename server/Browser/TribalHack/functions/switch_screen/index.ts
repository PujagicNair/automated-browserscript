import { TribalHack } from "../../index";
import { IMeta } from "../../IMeta";

export function run(hack: TribalHack, reqData: any) {
    return new Promise(async resolve => {
        let output = {
            goto(screen: string) {
                return new Promise(async resolve => {
                    if (screen != reqData.screen) {
                        hack.output('switched screen', screen);
                        await hack.browser.open(`${hack.config.server + hack.config.map}.${hack.server.url}/game.php?village=${hack.villageId}&screen=${screen}`);
                    }
                    return resolve();
                });

            }
        }
        return resolve(output);
    });
}

export const meta: IMeta = {
    name: 'switch-screen',
    description: 'Allows the script to navigate',
    config: [],
    requires: ['screen']
}