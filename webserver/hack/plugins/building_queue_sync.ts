import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    type: "plugin",
    tickrate: 2,
    name: 'building-queue-sync',
    description: 'Displays the building queue',
    requires: ['building-queue'],
    pluginSetup: {
        hasPage: false,
        hasWidget: true,
        hasTicks: true
    },
    widget: '<table>@str</table>',
    run: async function(_hack, _storage, requires) {
        let queue = requires['building-queue'].queue || [];
        let str = queue.map(row => `<tr><td>${row.name}</td><td>${row.duration}</td></tr>`).join('\n');
        if (!str) {
            str = '<tr><td>nothing is building</td></tr>';
        }
        return { str };
    }
}

export = plugin;