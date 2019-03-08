import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    name: 'buildings',
    tickrate: 6,
    description: 'shows the levels of buildings you have',
    requires: [],
    pluginSetup: {
        hasTicks: true,
        hasPage: false,
        hasWidget: true
    },
    widget: '<table>@str</table>',
    run: function(hack, storage) {
        function get() {
            return new Promise(async resolve => {
                let end;
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

                    end = { data, str: data.map(set =>
                        `<tr>
                            <td><img src="${set.img}"></td>
                            <td>${set.name}</td>
                            <td>${set.level}</td>
                        </tr>`).join('\n')
                    }
                    await storage.set('last', end);
                } else {
                    end = await storage.get('last', { data: [], str: 'never loaded' });
                }
                end.get = get;
                return resolve(end);
            });
        }
        return get();
    }
}

export = plugin;