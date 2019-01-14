import { IPlugin } from "../../interfaces";


const plugin: IPlugin = {
    name: 'screen',
    description: 'See the screen where the script is currently at',
    config: [],
    requires: [],
    pluginSetup: {
        hasPage: false,
        hasWidget: true
    },
    widget: 'currently on <b>@screen</b>',
    run(hack) {
        return new Promise(async resolve => {
            try {
                return resolve({ screen: hack.browser.url.match(/screen=(\w+)/)[1] });
            } catch (error) {
                return resolve({ screen: 'undefined' });
            }
            
        });
    }
}

export = plugin;