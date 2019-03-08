import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    name: 'plugin-name',
    tickrate: 6,
    description: 'interaction with building troopes',
    pluginSetup: {
        hasPage: false,
        hasTicks: true,
        hasWidget: false
    },
    requires: [],
    pre: function() {
        return new Promise(async resolve => {
            // preload plugin
        });
    },
    run: function(hack, storage, requires, util) {
        return new Promise(async resolve => {
            // handle ticks here
            //util.tr
            
        });
    }
}

export = plugin;