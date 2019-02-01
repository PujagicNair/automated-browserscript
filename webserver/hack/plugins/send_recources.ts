import { IPlugin } from "../interfaces";
let sleep = ms => new Promise(r => setTimeout(r, ms));

const plugin: IPlugin = {
    name: 'send-recources',
    description: 'automatically send recources to another village',
    pluginSetup: {
        hasPage: true,
        hasTicks: false,
        hasWidget: false
    },
    requires: [],
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
            <select id="villages" placeholder="your villages"></select>
            <br>
            <input id="wood" type="number" placeholder="amount wood">
            <input id="stone" type="number" placeholder="amount stone">
            <input id="iron" type="number" placeholder="amount iron">
            <br>
            <button id="send">Send</button>
        </div>

    `,
    pre: function(hack, storage) {
        return new Promise(async resolve => {
            await hack.gotoScreen('market');
            let total = await hack.browser.select('#market_merchant_total_count', 'innerText');
            await storage.set('merchants', Number(total));
            return resolve();
        });
    },
    pageControl: {
        pauseTicks: true,
        server: function(browser, input, output, storage) {
            input(async data => {
                if (data == 'init') {
                    return output({
                        type: 'init',
                        villages: browser.hack.villages.filter(village => village.id != browser.defaultPage),
                        merchants: await storage.get('merchants', 0)
                    });
                } else if (data.type == 'send') {
                    await browser.hack.gotoScreen('market', null, browser.defaultPage, { mode: 'send' });
                    let inputs = data.data;
                    if (inputs.x && inputs.y && (inputs.wood || inputs.stone || inputs.iron)) {
                        let legitNumbers = !Object.keys(inputs).some(key => inputs[key] && (!Number(inputs[key]) || (Number(inputs[key]) % 1 !== 0)));
                        if (!legitNumbers) {
                            return output({ type: 'error', message: 'wrong number format' });
                        }
                        try {
                            await browser.type('#market-send-form input[name=wood]', inputs.wood);
                            await browser.type('#market-send-form input[name=stone]', inputs.stone);
                            await browser.type('#market-send-form input[name=iron]', inputs.iron);
                            await browser.type('#market-send-form input[name=input]', inputs.x + '|' + inputs.y);
                            await browser.click('#delivery_target [type=submit]');
                            await sleep(300);
                            let error = await browser.select('.error_box', 'innerText');
                            if (error) {
                                return output({ type: 'error', message: error });
                            }
                            await browser.click('#market-confirm-form [type=submit]');
                            return output({ type: 'success', message: 'successfully sent recources' });
                        } catch (error) {
                            return output({ type: 'error', message: 'something went wrong' })
                        }
                    } else {
                        return output({ type: 'error', message: 'enter X, Y and at least 1 kind of recources' });
                    }
                }
            });
        },
        client: function(window, input, output) {

            let qs = (sel, scope?) => (scope || window.document).querySelector(sel);
            let qsa = (sel, scope?) => [...(scope || window.document).querySelectorAll(sel)];

            // handle client page here
            input(data => {
                if (data.type == 'error') {
                    qs('#error').innerText = data.message;
                    qs('#success').innerText = '';
                } else if (data.type == 'success') {
                    qs('#error').innerText = '';
                    qs('#success').innerText = data.message;
                } else if (data.type == 'init') {
                    let villageElem = qs('#villages');
                    villageElem.innerHTML = '<option value="|">-</option>' + data.villages.map(village => `<option value="${village.x}|${village.y}">${village.name}</option>`).join("");
                    villageElem.addEventListener('change', function() {
                        let val = villageElem.value;
                        let splits = val.split('|');
                        let x = splits[0];
                        let y = splits[1];
                        qs("#x").value = x;
                        qs("#y").value = y;
                    });
                }
            });



            let holder = qs('#holder');
            qs('#send', holder).addEventListener('click', function() {
                let data = qsa('input', holder).map(input => ({ key: input.id, value: input.value })).reduce((acc, input) => {
                    acc[input.key] = input.value;
                    return acc;
                }, {});
                output({ type: 'send', data });
            });

            output('init');
        }
    },
    run: function(hack, storage) {
        return new Promise(async resolve => {
            if (hack.screen == 'market') {
                let total = await hack.browser.select('#market_merchant_total_count', 'innerText');
                await storage.set('merchants', Number(total));
            }
            return resolve();
        });
    }
}

export = plugin;