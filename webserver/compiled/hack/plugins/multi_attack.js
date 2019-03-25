"use strict";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const plugin = {
    name: 'multi-attack',
    description: 'send multiple attacks with different speeds at the same time',
    pluginSetup: {
        hasPage: true,
        hasTicks: false,
        hasWidget: false
    },
    requires: [],
    pre: function (hack, storage) {
        return new Promise(async (resolve) => {
            await hack.gotoScreen('place');
            let inputsIDs = await hack.browser.selectMultiple('#command-data-form [id^=unit_input]', 'id');
            let inputs = [];
            for (let id of inputsIDs) {
                let data = JSON.parse(await hack.browser.page.evaluate(id => {
                    let elem = document.getElementById(id);
                    let name = elem.name;
                    let max = elem.getAttribute('data-all-count');
                    return JSON.stringify({ name, max });
                }, id));
                inputs.push(data);
            }
            await storage.set('units', inputs);
            return resolve();
        });
    },
    page: `<style> #error { color: darkred; background-color: red; } #success { color: darkgreen; background-color: lightgreen; } </style> <div id="error"></div> <div id="success"></div> <div id="holder"> <div id="pos"> <input id="x" type="text" placeholder="X" size="4" maxlength="4"> <input id="y" type="text" placeholder="Y" size="4" maxlength="4"> </div> <div id="units"></div> <div id="setup"> <input type="number" placeholder="how many times" id="times" value="1"> <input type="text" id="dateinput" placeholder="hh:mm:ss (empty = asap)"><br> <input type="hidden" id="indate"> </div> <div id="info"> <span id="datestr"></span> <br> <button id="send">Send</button> </div> </div>`,
    pageControl: {
        pauseTicks: true,
        server: function (browser, input, output, storage) {
            input(async (data) => {
                if (data == 'init') {
                    let units = await storage.get('units', []);
                    return output({ type: 'init', units });
                }
                else if (data.type == "send") {
                    let hack = browser.hack;
                    let input = data.data;
                    let times = Number(input.setup.times);
                    let tabs = {};
                    let tabKeys = [];
                    let ready = [];
                    for (let i = 0; i < times; i++) {
                        let key = `${i}-${Math.random().toString().slice(2)}`;
                        await hack.browser.newPage(key);
                        let tab = hack.browser.scoped(key);
                        tabs[key] = tab;
                        tabKeys.push(key);
                        await hack.gotoScreen('place', browser.defaultPage, key);
                        await sleep(200);
                        for (let unit in input.units)
                            if (input.units[unit]) {
                                await sleep(100);
                                await tab.type(`#unit_input_${unit}`, input.units[unit]);
                            }
                        await sleep(202);
                        await tab.type('#place_target input', `${input.pos.x}|${input.pos.y}`);
                        await tab.click('#target_attack');
                        await sleep(150);
                        let error = await tab.select('.error_box', 'innerText');
                        if (error) {
                            continue;
                        }
                        ready.push(key);
                        await sleep(1000);
                    }
                    await sleep(1000);
                    await Promise.all(ready.map(key => tabs[key].click('#troop_confirm_go')));
                }
            });
        },
        client: function (window, input, output) {
            let qs = (sel, scope) => (scope || window.document).querySelector(sel);
            let qsa = (sel, scope) => [...(scope || window.document).querySelectorAll(sel)];
            input(data => {
                if (data.type == 'init') {
                    qs('#units').innerHTML = data.units.map(unit => `
                        ${unit.name} (${unit.max}) <input type="number" id="${unit.name}" max="${unit.max}">
                    `).join('<br>');
                }
            });
            let dateinput = qs('#dateinput');
            dateinput.addEventListener('keyup', function () {
                try {
                    let val = dateinput.value;
                    let splits = val.split(':').map(v => v.trim());
                    if (splits.length != 3) {
                        throw 'invalid date @local';
                    }
                    let date = new Date();
                    date.setHours(splits[0]);
                    date.setMinutes(splits[1]);
                    date.setSeconds(splits[2]);
                    date.setMilliseconds(0);
                    if (date.getTime() < Date.now()) {
                        date.setDate(date.getDate() + 1);
                    }
                    qs('#datestr').innerHTML = date.toLocaleString();
                    qs('#indate').value = date.toUTCString();
                }
                catch (error) {
                    qs('#indate').value = "";
                }
            });
            let holder = qs('#holder');
            qs('#send', holder).addEventListener('click', function () {
                let data = {};
                let childs = holder.children;
                for (let i = 0; i < childs.length; i++) {
                    let child = childs[i];
                    data[child.id] = {};
                    qsa('input', child).forEach(input => {
                        data[child.id][input.id] = input.value;
                    });
                }
                ;
                output({ type: 'send', data });
            });
            output('init');
        }
    },
    run: function (hack, storage) {
        return new Promise(async (resolve) => {
            return resolve();
        });
    }
};
module.exports = plugin;
