import { IPlugin } from "../interfaces";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const plugin: IPlugin = {
    tickrate: 30,
    name: 'auto-quest',
    description: 'Beendet Quests automatisch wenn sie abgeschlossen sind',
    requires: [],
    pluginSetup: {
        hasPage: false,
        hasTicks: true,
        hasWidget: true
    },
    widget: 'Es wurden bereits <b>@done</b> Quests abgeschlossen',
    run: function(hack, storage) {
        return new Promise(async resolve => {
            let done = await storage.get('done', 0);
            let hasdone = await hack.browser.selectMultiple('.quest.finished', 'id');
            if (hasdone.length) {
                let id: string = hasdone[0];
                await hack.browser.page.evaluate(id => {
                    document.getElementById(id).click();
                }, id);
                await sleep(1000);
                await hack.browser.page.evaluate(() => {
                    document.querySelector<any>('#popup_box_quest .btn-confirm-yes').click();
                });
            }
            return resolve({ done });
        });
    }
}

export = plugin;