"use strict";
module.exports = {
    pauseTicks: false,
    server: function (browser, input, output, storage) {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        let buildings;
        input(async (data) => {
            let queue = await storage.get('queue', []);
            buildings = buildings || await storage.get('buildings', []);
            if (data == 'init') {
                let next = await storage.get('next', Date.now());
                let nextStr = new Date(next).toString();
                return output({ type: 'init', buildings, queue: queueOutput(), next: nextStr });
            }
            else if (data == 'force') {
                await storage.set('next', 0);
            }
            else if (data.type == 'add') {
                queue.push({ unit: data.unit, screen: data.screen });
                await storage.set('queue', queue);
                return output({ type: 'queue', queue: queueOutput() });
            }
            else if (data.type == 'swap') {
                let tempNum = data.index + (data.dir == "up" ? -1 : 1);
                let temp = queue[tempNum];
                queue[tempNum] = queue[data.index];
                queue[data.index] = temp;
                await storage.set('queue', queue);
                if (data.index === 0 || tempNum === 0) {
                    await storage.set('force', true);
                }
                return output({ type: 'queue', queue: queueOutput() });
            }
            else if (data.type == 'remove') {
                queue.splice(data.index, 1);
                await storage.set('queue', queue);
                return output({ type: 'queue', queue: queueOutput() });
            }
            else if (data.type == 'max-diff') {
                if (data.value) {
                    await storage.set('max-diff', Number(data.value) * 1000);
                    return output({ type: 'success', message: 'set max-diff to: ' + data.value + 's' });
                }
                else {
                    await storage.set('max-diff', 0);
                    return output({ type: 'success', message: 'removed max-diff' });
                }
            }
            function queueOutput() {
                return queue.map(entry => {
                    let newEntry = {};
                    let obj = (buildings || []).find(build => build.key == entry.unit) || { img: '', name: 'NOT FOUND', max: true };
                    newEntry.name = obj.name,
                        newEntry.img = obj.img;
                    newEntry.max = obj.max;
                    return newEntry;
                });
            }
        });
    },
    client: function (window, input, output) {
        let qs = sel => window.document.querySelector(sel);
        let qsa = sel => [...window.document.querySelectorAll(sel)];
        qs('#force').addEventListener('click', function () {
            return output('force');
        });
        qs('#set-max-diff').addEventListener('click', function () {
            return output({ type: 'max-diff', value: qs('#max-diff').value });
        });
        input(data => {
            if (data.queue)
                applyQueue(data.queue);
            if (data.buildings)
                applyBuildings(data.buildings);
            if (data.next)
                qs('#next').innerHTML = data.next;
            if (data.type == 'success')
                qs('#success').innerHTML = data.message;
        });
        function applyQueue(queue) {
            let queueString = "";
            queue.forEach((entry, index) => {
                queueString += `
                    <tr>
                        <td><table>
                            <tr><td>${index !== 0 ? `<i class="fa fa-arrow-up arrow" data-dir="up" data-index="${index}"></i>` : ''}</td></tr>
                            <tr><td>${index < (queue.length - 1) ? `<i class="fa fa-arrow-down arrow" data-dir="down" data-index="${index}"></i>` : ''}</td></tr>
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
                arrow.addEventListener('click', function () {
                    output({ type: 'swap', index: Number(arrow.getAttribute('data-index')), dir: arrow.getAttribute('data-dir') });
                });
            });
            qsa("#queue .remove").forEach(times => {
                times.addEventListener('click', function () {
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
                        <td>${build.level}</td>
                        <td><button class="addbtn" data-unit="${build.key}" ${build.max ? 'disabled' : ''}>Add</button></td>
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
        return output('init');
    }
};
