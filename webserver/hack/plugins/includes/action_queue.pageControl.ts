import { IPageControl, IRunFunction } from "../../interfaces";

interface MyWindow extends Window {
    [key: string]: any;
}

export = <IPageControl>{
    pauseTicks: false,
    server: function(browser, input, output, storage) {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        input(async data => {
            let queue = await storage.get('queue', []);
            if (data == 'init') {
                let buildings = await storage.get('buildings', []);
                return output({ type: 'init', buildings, queue });
            } else if (data == 'reload') {
                browser.hack.hold(browser.defaultPage, true);
                await sleep(500);
                let builds;
                await browser.hack.gotoScreen('main');
                await (<IRunFunction>browser.hack.pluginData['buildings'].run)(browser.hack, <any>{
                    get: (_key, def) => def,
                    set: (_key, val) => builds = val
                }, {});
                await storage.set('buildings', builds.data);
                return output({ type: 'reload', buildings: builds.data });
            } else if (data.type == 'add') {
                queue.push({ unit: data.unit, screen: data.screen });
                await storage.set('queue', queue);
                return output({ type: 'queue', queue });
            } else if (data.type == 'force') {
                await storage.set('force', true);
            } else if (data.type == 'swap') {
                let tempNum = data.index + (data.dir == "up" ? -1 : 1);
                let temp = queue[tempNum];
                queue[tempNum] = queue[data.index];
                queue[data.index] = temp;
                await storage.set('queue', queue);
                if (data.index === 0 || tempNum === 0) {
                    await storage.set('force', true);
                }
                return output({ type: 'queue', queue });
            } else if (data.type == 'remove') {
                queue.splice(data.index, 1);
                await storage.set('queue', queue);
                return output({ type: 'queue', queue });
            }
        });
    },
    client: function(window: MyWindow, input, output) {
        let qs = sel => window.document.querySelector(sel);
        let qsa = sel => [...<any>window.document.querySelectorAll(sel)];

        qs('#reload').addEventListener('click', function() {
            return output('reload');
        });

        input(data => {
            if (data.type == 'init') {
                applyBuildings(data.buildings);
                applyQueue(data.queue);
            } else if (data.type == 'queue') {
                applyQueue(data.queue);
            } else if (data.type == 'reload') {
                applyBuildings(data.buildings);
            }
        });

        function applyQueue(queue) {
            let queueString = "";
            queue.forEach((entry, index) => {
                queueString += `
                    <tr>
                        <td><table>
                            <tr><td>${index !== 0 ? `<i class="fa fa-arrow-up arrow" data-dir="up" data-index="${index}"></i>` : ''}</td></tr>
                            <tr><td>${index < (queue.length - 1) ? `<i class="fa fa-arrow-down arrow" data-dir="down" data-index="${index}"></i>`: ''}</td></tr>
                        </table></td>
                        <td>${entry.screen}</td>
                        <td>${entry.unit}</td>
                        <td>${entry.amount || ''}</td>
                        <td><i class="fa fa-times remove" data-index="${index}"></i></td>
                    </tr>
                `;
            });
            qs("#queue").innerHTML = queueString;
            qsa("#queue .arrow").forEach(arrow => {
                arrow.addEventListener('click', function() {
                    output({ type: 'swap', index: Number(arrow.getAttribute('data-index')), dir: arrow.getAttribute('data-dir') });                        
                });
            });
            qsa("#queue .remove").forEach(times => {
                times.addEventListener('click', function() {
                    output({ type: 'remove', index: Number(times.getAttribute('data-index')) });                        
                });
            });
        }

        function applyBuildings(buildings) {
            let blstr = "";
            for (let build of buildings) {
                blstr += `<tr><td><img src="${build.img}"></td><td>${build.name}</td><td>${build.level}</td>
                <td><button class="addbtn" data-unit="${build.key}">Add</button></td>
                </tr>`;
            }
            qs("#buildings").innerHTML = blstr;
            qsa("#buildings .addbtn").forEach(button => {
                button.addEventListener('click', () => {
                    output({ type: 'add', unit: button.getAttribute('data-unit'), screen: 'main' });
                });
            });
        }
        return output('init');
    }
}