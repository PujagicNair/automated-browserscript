import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    type: "util",
    name: 'buildings',
    tickrate: 6,
    description: 'loads the levels of buildings you have',
    requires: [],
    pluginSetup: {
        hasTicks: true,
        hasPage: false,
        hasWidget: false
    },
    run: function(hack, storage) {
        function get() {
            return new Promise(async resolve => {
                let end: any = { data: [] };
                if (hack.screen == "main") {
                    let rows = await hack.browser.selectMultiple('[id^=main_buildrow]', 'id');
                    let data = [];
                    for (let row of rows) {
                        let set: any = {};
                        let img = await hack.browser.select(`#${row} td:first-of-type img`, ['src', 'title']);
                        set.img = img.src;
                        set.name = img.title;
                        set.key = row.match(/main_buildrow_(.+)/)[1];
                        let levelMatch = (await hack.browser.select(`#${row} td:first-of-type span`, 'innerText')).match(/(\d+)/);
                        let max = await hack.browser.select(`#${row} td:nth-of-type(2).inactive`, 'innerText');
                        set.max = !!max;
                        set.level = levelMatch ? Number(levelMatch[1]) : 0;
                        data.push(set);
                    }

                    end.data = data;
                    await storage.set('last', data);
                } else {
                    end.data = await storage.get('last', []);
                }
                end.get = get;
                return resolve(end);
            });
        }
        return get();
    }
}

export = plugin;