import { IPageControl, IRunFunction } from "../../interfaces";

interface MyWindow extends Window {
    [key: string]: any;
}

export = <IPageControl>{
    pauseTicks: false,
    server: function(_browser, input, output, storage, util) {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        let buildings;
        input(async data => {
            let queue = await storage.get('queue', []);
            let troopQueue = await storage.get('troop-queue', []);
            buildings = buildings || await storage.get('buildings', []);
            if (data == 'init') {
                let next = await storage.get('next', Date.now());
                let nextStr = new Date(next).toString();
                return output({ type: 'init', buildings, queue: queueOutput(), troopQueue: troopOutput(), next: nextStr, troops: util.troops });
            } else if (data == 'force') {
                await storage.set('next', 0);
            } else if (data.type == 'add') {
                if (data.screen == 'main') {   
                    queue.push({ unit: data.unit, screen: data.screen });
                    await storage.set('queue', queue);
                    return output({ type: 'queue', queue: queueOutput() });
                } else if (data.screen == 'train') {
                    troopQueue.push({ unit: data.unit, amount: data.amount });
                    await storage.set('troop-queue', troopQueue);
                    return output({ type: 'troop-queue', troopQueue: troopOutput() });
                }
            } else if (data.type == 'swap') {
                let tempNum = data.index + (data.dir == "up" ? -1 : 1);
                let temp = queue[tempNum];
                queue[tempNum] = queue[data.index];
                queue[data.index] = temp;
                await storage.set('queue', queue);
                if (data.index === 0 || tempNum === 0) {
                    await storage.set('force', true);
                }
                return output({ type: 'queue', queue: queueOutput() });
            } else if (data.type == 'remove') {
                queue.splice(data.index, 1);
                await storage.set('queue', queue);
                return output({ type: 'queue', queue: queueOutput() });
            } else if (data.type == 'remove-troop') {
                /*queue.splice(data.index, 1);
                await storage.set('queue', queue);
                return output({ type: 'queue', queue: queueOutput() });*/
            } else if (data.type == 'max-diff') {
                if (data.value) {
                    await storage.set('max-diff', Number(data.value) * 1000);
                    return output({ type: 'success', message: 'set max-diff to: ' + data.value + 's' });
                } else {
                    await storage.set('max-diff', 0);
                    return output({ type: 'success', message: 'removed max-diff' });
                }
            }
            function queueOutput() {
                return queue.map(entry => {
                    let newEntry: any = { screen: entry.screen };
                    let obj = (buildings || []).find(build => build.key == entry.unit) || { img: '', name: 'NOT FOUND', max: true };
                    newEntry.name = obj.name,
                    newEntry.img = obj.img;
                    newEntry.max = obj.max;
                    return newEntry;
                });
            }

            function troopOutput() {
                return troopQueue.map(entry => {
                    let newEntry: any = { screen: entry.screen };
                    let obj = util.troops.find(troop => troop.key == entry.unit);
                    newEntry.name = obj.key,
                    newEntry.img = obj.img;
                    newEntry.amount = entry.amount;
                    return newEntry;
                });
            }
        });
    },
    client: function(window: MyWindow, input, output) {
        let qs = sel => window.document.querySelector(sel);
        let qsa = sel => [...<any>window.document.querySelectorAll(sel)];

        qs('#force').addEventListener('click', function() {
            return output('force');
        });

        qs('#set-max-diff').addEventListener('click', function() {
            return output({ type: 'max-diff', value: qs('#max-diff').value });
        });

        input(data => {
            if (data.queue) applyQueue(data.queue);
            if (data.troopQueue) applyTroopQueue(data.troopQueue);
            if (data.troops) applyTroops(data.troops);
            if (data.buildings) applyBuildings(data.buildings);
            if (data.next) qs('#next').innerHTML = data.next;
            if (data.type == 'success') qs('#success').innerHTML = data.message;
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
                        <td>
                            <img src="${entry.img}">
                        </td>
                        <td>${entry.name}</td>
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
                blstr += `
                    <tr>
                        <td>
                            <img src="${build.img}">
                        </td>
                        <td>${build.name}</td>
                        <td>${build.level} (+${build.up}/${build.queueUp})</td>
                        <td><button class="addbtn" data-unit="${build.key}" ${build.max ? 'disabled' : ''}>Upgrade to ${build.level + build.up + build.queueUp + 1}</button></td>
                    </tr>
                `;
            }
            qs("#buildings").innerHTML = blstr;
            qsa("#buildings .addbtn").forEach(button => {
                button.addEventListener('click', () => {
                    output({ type: 'add', unit: button.getAttribute('data-unit'), screen: 'main' });
                });
            });
        }

        function applyTroops(troops) {
            let trstr = "";
            for (let troop of troops) {
                trstr += `
                <tr data-unit="${troop.key}">
                    <td>
                        <img src="${troop.img}">
                    </td>
                    <td>${troop.key}</td>
                    <td><input type="number"></td>
                    <td><button class="addbtn" data-unit="${troop.key}">Build</button></td>
                </tr>
            `;
            }
            qs("#troops").innerHTML = trstr;
            qsa("#troops .addbtn").forEach(button => {
                button.addEventListener('click', () => {
                    let unit = button.getAttribute('data-unit')
                    output({ type: 'add', unit, screen: 'train', amount: qs(`#troops [data-unit=${unit}] input`).value });
                });
            });
        }

        function applyTroopQueue(queue) {
            let queueString = "";
            queue.forEach((entry, index) => {
                queueString += `
                    <tr>
                        <td><table>
                            <tr><td>${index !== 0 ? `<i class="fa fa-arrow-up arrow" data-dir="up" data-index="${index}"></i>` : ''}</td></tr>
                            <tr><td>${index < (queue.length - 1) ? `<i class="fa fa-arrow-down arrow" data-dir="down" data-index="${index}"></i>`: ''}</td></tr>
                        </table></td>
                        <td>
                            <img src="${entry.img}">
                        </td>
                        <td>${entry.name}</td>
                        <td>${entry.amount}</td>
                        <td><i class="fa fa-times remove" data-index="${index}"></i></td>
                    </tr>
                `;
            });
            qs("#troop-queue").innerHTML = queueString;
            qsa("#troop-queue .arrow").forEach(arrow => {
                arrow.addEventListener('click', function() {
                    output({ type: 'swap-troop', index: Number(arrow.getAttribute('data-index')), dir: arrow.getAttribute('data-dir') });                        
                });
            });
            qsa("#troop-queue .remove").forEach(times => {
                times.addEventListener('click', function() {
                    output({ type: 'remove-troop', index: Number(times.getAttribute('data-index')) });                        
                });
            });
        }
        return output('init');
    }
}