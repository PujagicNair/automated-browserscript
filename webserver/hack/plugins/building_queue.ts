import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    type: "util",
    tickrate: 2,
    name: 'building-queue',
    description: 'Utility plugin used to check the building queue',
    requires: [],
    pluginSetup: {
        hasPage: false,
        hasWidget: false,
        hasTicks: true
    },
    run: function(hack, storage) {
        function get() {
            return new Promise(async resolve => {
                if (hack.screen == 'main') {
                    let hasQueue = (await hack.browser.selectMultiple('#buildqueue', '')).length == 1;
                    if (!hasQueue) {
                        await storage.set('queue', { queue: [], time: Date.now() });
                        return resolve({ success: true, queue: [], get });
                    } else {
                        let rows: string[] = await hack.browser.selectMultiple('#buildqueue > tr', 'className');
                        let buildRows = rows.filter(row => ~row.indexOf('buildorder_')).map(row => rows.indexOf(row) + 1);
                        let queue = [];
                        for (let rowIndex of buildRows) {
                            let row: any = {};
                            let key = rows[rowIndex - 1].match(/buildorder_([\w_]+)/);
                            row.key = key && key[1];
                            
                            let rowItems: string[] = await hack.browser.selectMultiple(`#buildqueue > tr:nth-of-type(${rowIndex}) > td.lit-item`, 'innerText');
                            for (let item of rowItems) {
                                if (item.match(/\w+\n\w+/)) {
                                    row.name = item.replace(/\n/, ' - ');
                                } else if (item.match(/^[0-9]{1,2}:[0-9]{2,2}:[0-9]{2,2}$/)) {
                                    row.duration = item;
                                }
                            }
                            queue.push(row);
                        }
                        await storage.set('queue', { queue, time: Date.now() });
                        return resolve({ success: true, queue, get });
                    }
                } else {
                    let queue = await storage.get('queue');
                    return resolve({ success: false, get, queue });
                }
            });
        }
        return get();
    }
}

export = plugin;