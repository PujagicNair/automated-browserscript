import { IPlugin } from "../interfaces";
let sleep = ms => new Promise(r => setTimeout(r, ms));

function send(browser, pos, recources) {
    return new Promise(async (resolve, reject) => {
        await browser.hack.gotoScreen('market', null, browser.defaultPage, { mode: 'send' });
        try {
            await browser.type('#market-send-form input[name=wood]', recources.wood);
            await browser.type('#market-send-form input[name=stone]', recources.stone);
            await browser.type('#market-send-form input[name=iron]', recources.iron);
            await browser.type('#market-send-form input[name=input]', pos.x + '|' + pos.y);
            await browser.click('#delivery_target [type=submit]');
            await sleep(300);
            let error = await browser.select('.error_box', 'innerText');
            if (error) {
                return reject(error);
            }
            await browser.click('#market-confirm-form [type=submit]');
            return resolve();
        } catch (error) {
            return reject('something went wrong');
        }
    });
}

const plugin: IPlugin = {
    name: 'send-recources',
    description: 'automatically send recources to another village',
    pluginSetup: {
        hasPage: true,
        hasTicks: true,
        hasWidget: false
    },
    requires: [],
    page: '~send_recources.inc.html',
    pageControl: {
        pauseTicks: false,
        server: function(browser, input, output, storage) {
            function getOrders() {
                return new Promise(async resolve => {
                    let orders = await storage.get('orders', []);
                    let parsed = [];
                    for (let order of orders) {
                        parsed.push(await storage.get('order-' + order));
                    }
                    return resolve(parsed);
                });
            }
            input(async data => {
                if (data == 'init') {
                    return output({
                        type: 'init',
                        villages: browser.hack.villages.filter(village => village.id != browser.defaultPage),
                        orders: await getOrders()
                    });
                } else if (data.type == 'send') {
                    let { pos, recources, settings } = data.data;
                    if (pos.x && pos.y && (recources.wood || recources.stone || recources.iron)) {
                        let legitNumbers = !Object.keys(recources).some(key => recources[key] && (!Number(recources[key]) || (Number(recources[key]) % 1 !== 0)));
                        if (!legitNumbers) {
                            return output({ type: 'error', message: 'wrong number format' });
                        }
                        if (settings.forever === "true" && settings.every && settings.every.match(/\d{1,2}:\d{2,2}:\d{2,2}/)) {
                            let now = Date.now();
                            await storage.pushArray('orders', now);

                            let every = 0;
                            let splits: number[] = settings.every.split(':').map(Number);
                            every += (splits[0] * 3600000);
                            every += (splits[1] * 60000);
                            every += (splits[2] * 1000);
                            await storage.set('order-' + now, { pos, recources, every });
                            return output({ type: 'success', message: 'order placed' }) || output({ type: 'orders', orders: await getOrders() });
                        }

                        await send(browser, pos, recources).catch(error => output({ type: 'error', message: error }));
                    } else {
                        return output({ type: 'error', message: 'enter X, Y and at least 1 kind of recources' });
                    }
                } else if (data.type == 'remove') {
                    let orders = await storage.get('orders', []);
                    let id = orders[data.index];
                    orders.splice(data.index, 1);
                    await storage.set('orders', orders);
                    await storage.remove('next-' + id);
                    await storage.remove('order-' + id);
                    return output({ type: 'orders', orders: await getOrders() });
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
                    setOrders(data.orders);
                } else if (data.type == 'orders') {
                    setOrders(data.orders);
                }
            });

            function setOrders(orders: any[]) {
                let ordElem = qs('#orders');
                ordElem.innerHTML = orders.map((order, index) => `
                    <tr>
                        <td>${order.pos.x}|${order.pos.y}</td>
                        <td>${order.recources.wood || '-'}</td>
                        <td>${order.recources.stone || '-'}</td>
                        <td>${order.recources.iron || '-'}</td>
                        <td><i class="fa fa-times remove" data-index="${index}"></i></td>
                    </tr>
                `).join('');
                qsa('.remove', ordElem).forEach(btn => {
                    btn.addEventListener('click', function() {
                        output({ type: 'remove', index: Number(btn.getAttribute("data-index")) });
                    })
                });
            }

            let holder = qs('#holder');
            qs('button#send', holder).addEventListener('click', function() {
                let data = {};
                let childs: HTMLDivElement[] = holder.children;
                for (let i = 0; i < childs.length; i++) {
                    let child = childs[i];
                    data[child.id] = {};
                    qsa('input', child).forEach(input => {
                        data[child.id][input.id] = input.value;
                    });
                };
                output({ type: 'send', data });
            });

            output('init');
        }
    },
    run: function(hack, storage) {
        return new Promise(async resolve => {
            let orders = await storage.get('orders', []);
            for (let orderID of orders) {
                let next = await storage.get('next-' + orderID, 0);
                if (Date.now() > next) {
                    let order = await storage.get('order-' + orderID, null);
                    if (order) {
                        await send(hack.browser, order.pos, order.recources).catch(console.error);
                        await storage.set('next-' + orderID, Date.now() + order.every);
                    }
                }
            }
            return resolve();
        });
    }
}

export = plugin;