import { IApi, ISocket, IHackConfig, PluginRequireData, IStatus, DefaultOutput, PluginOutput, widgetOutput, IVillage } from "./interfaces";
import { Browser } from "./browser";
import sleep from "./helpers/sleep";
import getStorage from "./helpers/get_storage";
import providePluginsFor from "./helpers/plugin_require_provider";
import loadPlugins from "./helpers/plugin_loader";
import createSession from "./helpers/create_session";
import multiVillages from "./helpers/multi_village";

export class Hack {

    static PLUGINS: PluginRequireData;

    static from(input: IHackConfig, api: IApi, socket: ISocket): Hack {
        return new Hack(input, api, socket);
    }

    static setup() {
        return new Promise(async resolve => {
            Hack.PLUGINS = await loadPlugins();
            return resolve();
        });
    }

    // props
    villages: IVillage[] = [];
    browser: Browser;
    pluginData: PluginRequireData;
    connected: boolean;

    // private
    private _status: IStatus = 'offline';
    private defaultOutput: DefaultOutput;
    private pluginOutput: PluginOutput;
    private widgetOutput: widgetOutput;
    private runpage = {};
    private tickListeners = [];
    private holdPages = {};

    private constructor(public config: IHackConfig, api: IApi, private socket: ISocket) {
        loadPlugins(this);
        
        // set output
        this.defaultOutput = (action: string, data: any) => socket.emit('default', { action, data });
        this.widgetOutput = (village: string, data) => socket.emit('widget', { village, data });
        this.pluginOutput = (village: string, plugin: string, data: any) => socket.emit('plugin', { plugin, village, data });

        this.connected = true;

        // handle api
        api.on('connected', (res, value) => {
            this.connected = value;
            return res({ success: true });
        });

        api.on('setup', async res => {
            try {
                await this.setup();
                return res({ success: true });
            } catch (error) {
                return res({ success: false, message: error });
            }
        });

        api.on('stop', (res) => {
            this.stop();
            return res({ success: false, message: 'not implemented' });
        });

        api.on('villages', res => {
            return res({ success: true, villages: this.villages });
        });

        api.on('kill', async res => {
            this.connected = false;
            this.stop();
            await this.browser.kill();
            res({ success: true });
            await sleep(500);
            process.exit(0);
            return null;
        });

        api.on('start', async res => {
            this.start();
            return res({ success: true });
        });

        api.on('hold', res => {
            //this.hold();
            console.log('api hold call');
            return res({ success: true });
        });

        api.on('deserialize', async res => {
            return res({ success: true, data: this.deserialize() });
        });

        api.on('openpage', (res, data) => {
            let plugin = data.plugin;
            let page = this.pluginData[plugin];
            let village = data.village;

            if (page.pluginSetup.hasPage && page.page) {
                if (page.pageControl) {
                    let handlers: Function[] = [];
                    let input = callback => handlers.push(callback);
                    let output = data => this.pluginOutput(village, plugin, data);
                    if (page.pageControl.pauseTicks) {
                        this.hold(village, true);
                    }
                    let storage = getStorage(socket, plugin, village);
                    this.runpage[village] = page.pageControl.server(<any>(this.browser.scoped(village)), input, output, storage, this.browser.page[village]);
                    
                    socket.on(`page-${plugin}-${village}`, data => {
                        handlers.forEach(handler => handler(data));
                    });
                }
                return res({ success: true, page: page.page, runtime: page.pageControl ? page.pageControl.client.toString() : '' });
            } else {
                return res({ success: false, message: 'plugin doesnt have a page' });
            }
        });

        api.on('closepage', (res, data) => {
            if (this.runpage[data.village]) {
                this.runpage[data.village]();
                delete this.runpage[data.village];
            }

            socket.off(`page-${data.plugin}-${data.village}`);
            
            let page = this.pluginData[data.plugin];
            if (page.pageControl && page.pageControl.pauseTicks) {
                this.hold(data.village, false);
            }
            return res({ success: true });
        });

        api.on('reload', async res => {
            await Hack.setup();
            loadPlugins(this);
            return res({ success: true });
        });
    }

    // functions
    private setup() {
        return new Promise(async (resolve, reject) => {
            try {
                this.browser = new Browser(this);
                await this.browser.start();
                await createSession(this);
                await multiVillages(this);

                // handle multiple villages
                (async () => {
                    await sleep(500);
                    for (let village of this.villages) {
                        this.browser.defaultPage = village.id;
                        for (let plugin of this.config.plugins) {
                            let meta = this.pluginData[plugin];
                            if (meta.pre) {                    
                                await meta.pre(this, getStorage(this.socket, plugin, village.id), providePluginsFor(this.pluginData, meta.requires));
                            }
                        }
                    }
                    this.status = 'ready';
                    this.start();
                })();
                return resolve();
            } catch (error) {
                return reject(error);
            }
        });
    }

    start() {
        this.status = 'running';
        (async () => {
            while (this.status == 'running') {
                try {
                    let data = await this.tick();
                    this.defaultOutput('tick', data);
                } catch (error) {
                    console.log('tick failed');
                }
                await sleep(10000);
            }
        })();
    }

    nextTick(callback) {
        this.tickListeners.push(callback);
    }

    tick() {
        return new Promise(async resolve => {
            let all = {};
            for (let village of this.villages) {
                if (this.holdPages[village.id]) {
                    all[village.id] = {};
                    continue;
                }
                let data = {};
                this.browser.defaultPage = village.id;
                for (let plugin of this.config.plugins) {
                    let script = this.pluginData[plugin];
                    if (script.pluginSetup.hasTicks && this.connected) {
                        try {
                            let storage = getStorage(this.socket, plugin, village.id);
                            let run = script.run(this, storage, providePluginsFor(data, script.requires)).catch(err => console.log("tick threw", plugin, err));
                            let time = sleep(15000, {});
                            let output = await Promise.race([ run, time ]);
    
                            if (JSON.stringify(output) == '{}') {
                                console.log('plugin tick timed out:', plugin);
                            }
                            data[plugin] = output;
                        } catch (error) {
                            console.log(error);
                        }
                    }
                }
                all[village.id] = data;
                this.widgetOutput(village.id, data);
            }
            return resolve(all);
        });
    }

    gotoScreen(screen: string, villageid?: string, page?: string, additions?: { [key: string]: string }) {
        let addstr = '';
        if (additions) {
            Object.keys(additions).forEach(key => {
                addstr += `&${key}=${additions[key]}`;
            });
        }
        if (this.screen != screen || addstr) {
            let browser = page ? this.browser.scoped(page) : this.browser;
            let villageId: string = villageid || browser.defaultPage;
            
            return browser.open(`${this.config.serverCode}.${this.config.serverUrl}/game.php?village=${villageId}&screen=${screen}${addstr}`);
        }
    }

    hold(village: string, value: boolean) {
        this.holdPages[village] = value;
    }

    pause() {
        this.stop();
        this.status = 'paused';
    }

    kill() {
        return new Promise(async resolve => {
            this.status = 'offline';
            await this.browser.exit();
            return resolve();
        });
    }

    stop() {
        this.status = 'ready';
    }

    deserialize() {
        let data = {};
        ['config', 'status', 'pluginData'].forEach(key => {
            data[key] = JSON.parse(JSON.stringify(this[key]));
        });
        return data;
    }

    // getter / setter
    public get status() : IStatus {
        return this._status;
    }

    public set status(v : IStatus) {
        this._status = v;
        this.defaultOutput('status', v);
    }

    get screen(): string {
        try {
            return this.browser.url.match(/screen=(\w+)/)[1];
        } catch (e) {
            return 'ERROR';
        }
    }
}