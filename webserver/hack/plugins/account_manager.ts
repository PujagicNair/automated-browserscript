import { IPlugin } from "../interfaces";

const plugin: IPlugin = {
    type: "plugin",
    name: 'account-manager',
    tickrate: 12,
    description: 'Base for managing accounts',
    pluginSetup: {
        hasPage: false,
        hasTicks: true,
        hasWidget: false
    },
    requires: [],
    page: `TODO`,
    widget: ``,
    /*pre: function() {
        return new Promise(async resolve => {
            // preload plugin
        });
    },
    pageControl: {
        pauseTicks: false,
        server: function(browser, input, output, storage, extensions) {
            // handle server page here
            input(data => {
                if (data == 'init') {
                    // init serverside plugin page
                }
            });
        },
        client: function(window, input, output) {
            // handle client page here
            input(data => {

            });

            output('init');
        }
    },*/
    run: function(_hack, storage, _requires, util, extensions) {
        function matchObj(obj, match) {
            return !Object.keys(match).some(key => obj[key] != match[key]);
        }
        return new Promise(async resolve => {
            let nextTime = await storage.get('next', 0);
            let queue = await storage.get('queue', []);

            /**
             * Dumb
             */
            if (_hack.browser.defaultPage == '2193') {
                queue = [{ screen: 'main', unit: 'barracks' }];
            } else {
                queue = [{ screen: 'main', unit: 'iron' }];
            }

            if (queue.length && (Date.now() > nextTime)) {
                let next = queue[0];
                for (let ext of Object.keys(extensions)) {
                    let ret = await extensions[ext]();
                    if ((ret.tickHandle && matchObj(next, ret.tickHandle) && ret.tick) || (!ret.tickHandle && ret.tick)) {
                        let run = await ret.tick(next);
                    }
                }
            }

            return resolve();
        });
    }
}

export = plugin;