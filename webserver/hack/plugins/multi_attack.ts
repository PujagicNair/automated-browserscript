import { IPlugin } from "../interfaces";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const plugin: IPlugin = {
    name: 'multi-attack',
    description: 'send multiple attacks with different speeds at the same time',
    pluginSetup: {
        hasPage: true,
        hasTicks: false,
        hasWidget: false
    },
    requires: [],
    pre: function(hack, storage) {
        return new Promise(async resolve => {
            await hack.gotoScreen('place');
            let inputsIDs = await hack.browser.selectMultiple('#command-data-form [id^=unit_input]', 'id');
            let inputs = [];
            for (let id of inputsIDs) {
                let data = JSON.parse(await hack.browser.page.evaluate(id => {
                    let elem: HTMLInputElement = <any>document.getElementById(id);
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
    page: `
        <style>
            #error {
                color: darkred;
                background-color: red;
            }
            #success {
                color: darkgreen;
                background-color: lightgreen;
            }
        </style>
        <div id="error"></div>
        <div id="success"></div>
        <div id="holder">
            <input id="x" type="text" placeholder="X" size="4" maxlength="4">
            <input id="y" type="text" placeholder="Y" size="4" maxlength="4">
            <br>
            <div id="units"></div>
            <br>
            <input type="text" id="dateinput" placeholder="hh:mm:ss"><br>
            <span id="datestr"></span>
            <br>
            <button id="send">Send</button>
        </div>
    `,
    widget: `
        <div>
            HTML Content of the Widget
        </div>
    `,
    pageControl: {
        pauseTicks: true,
        server: function(browser, input, output, storage) {
            // handle server page here
            input(async data => {
                if (data == 'init') {
                    let units = await storage.get('units', []);
                    return output({ type: 'init', units });
                }
            });
        },
        client: function(window, input, output) {
            // handle client page here
            let qs = (sel, scope?) => (scope || window.document).querySelector(sel);
            let qsa = (sel, scope?) => [...(scope || window.document).querySelectorAll(sel)];

            input(data => {
                if (data.type == 'init') {
                    qs('#units').innerHTML = data.units.map(unit => `
                        ${unit.name} (${unit.max}) <input type="number" max="${unit.max}">
                    `).join('<br>');
                }
            });

            let dateinput = qs('#dateinput');
            dateinput.addEventListener('keyup', function() {
                try {
                    let val = dateinput.value;
                    let splits = val.split(':').map(v => v.trim());
                    let date = new Date();
                    date.setHours(splits[0]);
                    date.setMinutes(splits[1]); 
                    date.setSeconds(splits[2]);
                    date.setMilliseconds(0);
                    if (date.getTime() < Date.now()) {
                        date.setDate(date.getDate() + 1);
                    }
                    qs('#datestr').innerHTML = date.toLocaleString();
                } catch (error) {
                    
                }

            });

            output('init');
        }
    },
    run: function(hack, storage) {
        /*function posById(id: string): Promise<{ x: number, y: number }> {
            return new Promise(async resolve => {
                let pos = await hack.browser.page.evaluate((id) => {
                    let { x, y } = <any>document.querySelector('#' + id).getBoundingClientRect();
                    return `${x};${y}`;
                }, id);
                return resolve({ x: Number(pos.split(';')[0]), y: Number(pos.split(';')[0]) })
            });
        }
        return new Promise(async resolve => {
            await hack.gotoScreen('map');
            let map_icons = await hack.browser.selectMultiple('#map_container [id^=map_village]', 'id');
            await sleep(500);
            let map_pos = await posById('map');
            for (let icon of map_icons) {
                let { x, y } = await posById(icon);
                await sleep(50);
                await hack.browser.page.mouse.move(x, y);
                await hack.browser.select
            }
            return resolve();
        });*/
        return new Promise(async resolve => {
            // handle tick
            return resolve();
        });
    }
}

export = plugin;