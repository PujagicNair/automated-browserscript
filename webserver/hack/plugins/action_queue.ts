import { IPlugin } from "../interfaces";

const plugin: IPlugin = {
    type: "plugin",
    tickrate: 12,
    name: 'action-queue',
    description: 'give the script a list of things it has todo',
    requires: ['buildings', 'build', 'building-queue'],
    pre: async function(hack, storage, requires) {
        await hack.gotoScreen("main");
        let builds;
        await requires['buildings'].run(hack, {
            get: (_key, def) => def,
            set: (_key, val) => builds = val 
        });
        await storage.set('buildings', builds.data);
    },
    pluginSetup: {
        hasPage: true,
        hasWidget: true,
        hasTicks: true
    },
    page: '~action_queue.page.html',
    pageControl: '~action_queue.pageControl.js',
    widget: '@wdStr',
    run: '~action_queue.run.js'
}

export = plugin;