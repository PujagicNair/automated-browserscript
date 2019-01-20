import { IApi, ISocket, IHackConfig, PluginRequireData, IStatus, DefaultOutput, PluginOutput } from "./interfaces";
import { Browser } from "./browser";
import sleep from "./helpers/sleep";
import getStorage from "./helpers/get_storage";
import providePluginsFor from "./helpers/plugin_require_provider";
import loadPlugins from "./helpers/plugin_loader";
import createSession from "./helpers/create_session";

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
    villageId: string;
    browser: Browser;
    pluginData: PluginRequireData;

    // private
    private _status: IStatus = 'offline';
    private defaultOutput: DefaultOutput;
    private pluginOutput: PluginOutput;
    private widgetOutput: PluginOutput;
    private runpage;

    private constructor(public config: IHackConfig, api: IApi, private socket: ISocket) {
        loadPlugins(this);
        
        // set output
        this.defaultOutput = (action: string, data: any) => socket.emit('default', { action, data });
        this.widgetOutput = (plugin: string, data: any) => socket.emit('widget', { plugin, data });
        this.pluginOutput = (plugin: string, data: any) => socket.emit('plugin', { plugin, data });

        // handle api
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

        api.on('kill', async res => {
            await this.browser.kill();
            process.exit(0);
            return res({ success: true });
        });

        api.on('start', async res => {
            this.start();
            return res({ success: true });
        });

        api.on('hold', res => {
            this.hold();
            return res({ success: true });
        });

        api.on('deserialize', async res => {
            return res({ success: true, data: this.deserialize() });
        });

        api.on('widget', (res, plugin) => {
            let widget = this.pluginData[plugin];
            if (widget.pluginSetup.hasWidget && widget.widget) {
                return res({ success: true, widget: widget.widget });
            } else {
                return res({ success: false, message: 'plugin doesnt have a widget' });
            }
        });

        api.on('openpage', (res, plugin) => {
            let page = this.pluginData[plugin];
            if (page.pluginSetup.hasPage && page.page) {
                if (page.pageControl) {
                    let handlers: Function[] = [];
                    let input = callback => handlers.push(callback);
                    let output = data => this.pluginOutput(plugin, data);
                    if (page.pageControl.pauseTicks) {
                        this.hold();
                    }
                    let storage = getStorage(socket, plugin);
                    this.runpage = page.pageControl.server(this, input, output, storage);
                    socket.on(`page/${plugin}`, data => {
                        handlers.forEach(handler => handler(data));  
                    });
                }
                return res({ success: true, page: page.page, runtime: page.pageControl ? page.pageControl.client.toString() : '' });
            } else {
                return res({ success: false, message: 'plugin doesnt have a page' });
            }
        });

        api.on('closepage', (res, plugin) => {
            if (this.runpage) {
                this.runpage();
                this.runpage = undefined;
            }
            let page = this.pluginData[plugin];
            if (page.pageControl && page.pageControl.pauseTicks) {
                this.start();
            }
            return res({ success: true });
        });
    }

    // functions
    private setup() {
        return new Promise(async (resolve, reject) => {
            try {
                this.browser = new Browser();
                await this.browser.start();
                await createSession(this);
                this.status = 'ready';
                this.start();
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
                let data = await this.tick();
                this.defaultOutput('tick', data);
                await sleep(10000);
            }
        })();
    }

    tick() {
        return new Promise(async resolve => {
            let data = {};
            for (let plugin of this.config.plugins) {
                let storage = getStorage(this.socket, plugin);
                let script = this.pluginData[plugin];
                if (script.pluginSetup.hasTicks) {
                    let output = await script.run(this, storage, providePluginsFor(data, script.requires));
                    if (script.pluginSetup.hasWidget) {
                        this.widgetOutput(plugin, output);
                    }
                    if (script.pluginSetup.hasPage) {
                        this.pluginOutput(plugin, output);
                    }
                    data[plugin] = output;
                }
            } 
            return resolve(data);
        });
    }

    gotoScreen(screen: string) {
        if (this.screen != screen) {
            return this.browser.open(`${this.config.serverCode}.${this.config.serverUrl}/game.php?village=${this.villageId}&screen=${screen}`);
        }
    }

    hold() {
        this.status = 'onhold';
    }

    pause() {
        this.stop();
        this.status = 'paused';
    }

    kill() {
        return new Promise(async resolve => {
            this.status = 'offline';
            await this.browser.exit();
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