import { IPlugin } from "../interfaces";

const plugin: IPlugin = {
    type: "plugin",
    tickrate: 2,
    name: 'screen-sync',
    description: 'See the screen where the script is currently at',
    requires: [],
    pluginSetup: {
        hasPage: false,
        hasWidget: true,
        hasTicks: true
    },
    widget: 'currently on <b>@screen</b>',
    run(hack) {
        return new Promise(async resolve => {
            return resolve({ screen: hack.screen });
        });
    }
}

export = plugin;