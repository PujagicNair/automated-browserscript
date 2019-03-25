import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    type: "util",
    name: 'buildings-sync',
    tickrate: 6,
    description: 'shows the levels of buildings you have',
    requires: ['buildings'],
    pluginSetup: {
        hasTicks: true,
        hasPage: false,
        hasWidget: true
    },
    widget: '<table>@str</table>',
    run: async function(_hack, _storage, requires) {
        let data = requires['buildings'].data;
        let str = data.map(set => `<tr><td><img src="${set.img}"></td><td>${set.name}</td><td>${set.level}</td></tr>`).join('\n');
        return { str };
    }
}

export = plugin;