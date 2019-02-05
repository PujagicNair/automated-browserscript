import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    name: 'train-troops',
    description: 'Automatically train troops including orders for building over time',
    pluginSetup: {
        hasPage: true,
        hasTicks: true,
        hasWidget: false
    },
    requires: [],
    page: '~train_troops.page.html',
    pageControl: {
        pauseTicks: true,
        server: function(browser, input, output, storage) {
            let sleep = ms => new Promise(r => setTimeout(r, ms));
            // handle server page here
            input(async data => {
                if (data == 'init') {
                    // init serverside plugin page
                } else if (data.type == 'train-barracks') {
                    await browser.hack.gotoScreen('barracks', null, browser.defaultPage);
                    let { spear, sword, axe } = data.troops;

                    try {
                        await browser.type('#train_form [name=spear]', spear, true);
                        await browser.type('#train_form [name=sword]', sword, true);
                        await browser.type('#train_form [name=axe]', axe, true);
                        await sleep(300);
                        let spear_inactive = spear && await browser.page.evaluate(() => (<any>document).querySelector('#train_form [name=spear]').style.color == 'red');
                        let sword_inactive = sword && await browser.page.evaluate(() => (<any>document).querySelector('#train_form [name=sword]').style.color == 'red');
                        let axe_inactive = axe && await browser.page.evaluate(() => (<any>document).querySelector('#train_form [name=axe]').style.color == 'red');
                        
                        if (spear_inactive) {
                            return output({ type: 'error', message: 'cannot build spears' });
                        } else if (sword_inactive) {
                            return output({ type: 'error', message: 'cannot build swords' });
                        } else if (axe_inactive) {
                            return output({ type: 'error', message: 'cannot build axes' });
                        }
                        await sleep(300);
                        await browser.click('#train_form [type=submit]');
                        return output({ type: 'success', message: 'started training' });
                    } catch (error) {
                        return output({ type: 'error', message: 'something went wrong' });
                    }
                } else if (data.type == 'train-stable') {
                    await browser.hack.gotoScreen('stable', null, browser.defaultPage);
                    let { spy, light, heavy } = data.troops;

                    try {
                        let can_build = {
                            spy: await browser.select('#train_form [name=spy]', 'id'),
                            light: await browser.select('#train_form [name=light]', 'id'),
                            heavy: await browser.select('#train_form [name=heavy]', 'id')
                        };
                        can_build.spy && await browser.type('#train_form [name=spy]', spy, true);
                        can_build.light && await browser.type('#train_form [name=light]', light, true);
                        can_build.heavy && await browser.type('#train_form [name=heavy]', heavy, true);
                        await sleep(300);
                        let spy_inactive = can_build.spy && spy && await browser.page.evaluate(() => (<any>document).querySelector('#train_form [name=spy]').style.color == 'red');
                        let light_inactive = can_build.light && light && await browser.page.evaluate(() => (<any>document).querySelector('#train_form [name=light]').style.color == 'red');
                        let heavy_inactive = can_build.heavy && heavy && await browser.page.evaluate(() => (<any>document).querySelector('#train_form [name=heavy]').style.color == 'red');
                        
                        if (spy_inactive) {
                            return output({ type: 'error', message: 'cannot build spys' });
                        } else if (light_inactive) {
                            return output({ type: 'error', message: 'cannot build lights' });
                        } else if (heavy_inactive) {
                            return output({ type: 'error', message: 'cannot build heavys' });
                        } else if (!can_build.spy && !can_build.light && !can_build.heavy) {
                            return output({ type: 'error', message: 'stable not avaible' });
                        }
                        await sleep(300);
                        await browser.click('#train_form [type=submit]');
                        return output({ type: 'success', message: 'started training' });
                    } catch (error) {
                        console.log(error);
                        
                        return output({ type: 'error', message: 'something went wrong' });
                    }
                }
            });
        },
        client: function(window, input, output) {
            // handle client page here

            let qs = (sel, scope?) => (scope || window.document).querySelector(sel);
            let qsa = (sel, scope?) => [...(scope || window.document).querySelectorAll(sel)];

            input(data => {
                if (data.type == 'error') {
                    qs('#error').innerText = data.message;
                    qs('#success').innerText = '';
                } else if (data.type == 'success') {
                    qs('#error').innerText = '';
                    qs('#success').innerText = data.message;
                }
            });

            let holder = qs('#holder');
            qs("#barracks .send", holder).addEventListener("click", function() {
                let inputs = {};
                qsa("#barracks input", holder).forEach(input => {
                    inputs[input.id] = input.value;
                });
                output({ type: 'train-barracks', troops: inputs });
            });

            qs("#stable .send", holder).addEventListener("click", function() {
                let inputs = {};
                qsa("#stable input", holder).forEach(input => {
                    inputs[input.id] = input.value;
                });
                output({ type: 'train-stable', troops: inputs });
            });

            output('init');
        }
    },
    run: function(hack, storage) {
        return new Promise(async resolve => {
            // handle ticks here
            return resolve();
        });
    }
}

export = plugin;