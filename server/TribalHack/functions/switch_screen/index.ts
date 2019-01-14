import { IPlugin } from "../../interfaces";


const plugin: IPlugin = {
    name: 'switch-screen',
    description: 'Allows the script to navigate',
    config: [],
    requires: ['screen'],
    pluginSetup: {
        hasPage: false,
        hasWidget: false
    },
    run(hack, _, reqData) {
        return new Promise(async resolve => {
            let output = {
                goto(screen: string) {
                    return new Promise(async resolve => {
                        if (screen != reqData['screen'].screen) {
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
}

export = plugin;