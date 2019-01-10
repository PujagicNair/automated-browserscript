import { TribalHack } from "../../index";
import { IMeta } from "../../IMeta";

export function run(hack: TribalHack, reqData: any) {
    return new Promise(async resolve => {
        let output = {
            goto(screen: string) {
                return new Promise(async resolve => {
                    if (screen != reqData['screen']) {
                        this.data.push('switched screen to ' + screen);
                        await hack.browser.open(`${hack.config.server + hack.config.map}.${hack.server.url}/game.php?village=${hack.villageId}&screen=${screen}`);
                    } else {
                        this.data.push('didnt switch screen, already on it');
                    }
                    return resolve();
                });

            },
            data: []
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