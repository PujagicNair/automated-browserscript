import { IPlugin, Browser } from "../interfaces";
let sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

type Recources = { wood: string, stone: string, iron: string };

function send(browser: Browser, pos: { x: number, y: number }, recources: Recources) {
    return new Promise(async (resolve, reject) => {
        await browser.hack.gotoScreen('market', null, browser.defaultPage, { mode: 'send' });
        try {
            await sleep(500);
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
            await sleep(500);
            await browser.click('#market-confirm-form [type=submit]');
            return resolve();
        } catch (error) {
            return reject('something went wrong');
        }
    });
}

const plugin: IPlugin = {
    type: "plugin",
    name: 'send-recources',
    tickrate: 10,
    description: 'automatically send recources to another village',
    pluginSetup: {
        hasPage: true,
        hasTicks: true,
        hasWidget: true
    },
    widget: '@wdStr',
    requires: [],
    page: '~send_recources.page.html',
    pageControl: {
        pauseTicks: false,
        server: function(browser, input, output, storage, util) {
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
                            
                            let orders = await storage.get('orders', []);
                            orders.push(now);
                            await storage.set('orders', orders);

                            let every = util.time.fromString(settings.every);
                            await storage.set('order-' + now, { pos, recources, every });

                            return output({ type: 'success', message: 'order placed', orders: await getOrders() });
                        }

                        send(browser, pos, recources)
                            .then(() => output({ type: 'success', message: 'sent' }))
                            .catch(error => output({ type: 'error', message: error }));
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
                    return output({ orders: await getOrders() });
                }
            });
        },
        client: function(window, input, output) {

            let qs = (sel, scope?) => (scope || window.document).querySelector(sel);
            let qsa = (sel, scope?) => [...(scope || window.document).querySelectorAll(sel)];

            // handle client page here
            input(data => {
                if (data.orders) {
                    setOrders(data.orders);
                }
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
    run: function(hack, storage, _required, util) {
        return new Promise(async resolve => {
            let ordersIDs = (await storage.get('orders', []));
            let orders = [];
            
            for (let id of ordersIDs) {
                let order: any = {};
                let om: any = await storage.get('order-' + id, {});
                order.id = id;
                order.next = await storage.get('next-' + id, 0);
                order.every = om.every;
                order.to = om.pos;
                order.recources = om.recources;
                orders.push(order);
            }
            
            orders = orders.sort((a, b) => a.next - b.next);
            for (let order of orders) {
                if (Date.now() > order.next) {
                    //await send(hack.browser, order.to, order.recources).catch(console.error);
                    await storage.set('next-' + order.id, Date.now() + order.every);
                }
            }
            let wdStr: string;
            if (orders.length !== 0) {
                let str = '<table><tr><th>To</th><th>Wood</th><th>Stone</th><th>Iron</th><th>Next</th><th>Every</th></tr>';
                for (let order of orders) {
                    let village = hack.villages.find(village => village.x == order.to.x && village.y == order.to.y);
                    str += `
                        <tr>
                            <td>${order.to.x}|${order.to.y}${village ? ' (' + village.name + ')' : ''}</td>
                            <td style="text-align:center;">${order.recources.wood || '-'}</td>
                            <td style="text-align:center;">${order.recources.stone || '-'}</td>
                            <td style="text-align:center;">${order.recources.iron || '-'}</td>
                            <td>${order.next ? new Date(order.next).toLocaleString() : 'now'}</td>
                            <td>${util.time.toFormatString(order.every)}</td>
                        </tr>
                    `;
                }
                str += '</table>';
                wdStr = str;
            } else {
                wdStr = 'No active send orders';
            }

            return resolve({ wdStr });
        });
    }
}

export = plugin;