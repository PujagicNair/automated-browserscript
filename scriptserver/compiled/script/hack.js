"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const browser_1 = require("./browser");
const sleep_1 = __importDefault(require("./helpers/sleep"));
const get_storage_1 = __importDefault(require("./helpers/get_storage"));
const plugin_require_provider_1 = __importDefault(require("./helpers/plugin_require_provider"));
const plugin_loader_1 = __importDefault(require("./helpers/plugin_loader"));
const create_session_1 = __importDefault(require("./helpers/create_session"));
const multi_village_1 = __importDefault(require("./helpers/multi_village"));
const util_1 = __importDefault(require("./helpers/util"));
class Hack {
    constructor(config, api, socket) {
        this.config = config;
        this.socket = socket;
        // props
        this.villages = [];
        // private
        this._status = 'offline';
        this.runpage = {};
        this.holdPages = {};
        plugin_loader_1.default(this);
        // set output
        this.defaultOutput = (action, data) => socket.emit('default', { action, data });
        this.widgetOutput = (village, data) => socket.emit('widget', { village, data });
        this.pluginOutput = (village, plugin, data) => socket.emit('plugin', { plugin, village, data });
        this.connected = true;
        // handle api
        api.on('connected', (res, value) => {
            this.connected = value;
            return res({ success: true });
        });
        api.on('setup', async (res) => {
            try {
                await this.setup();
                return res({ success: true, pid: process.pid });
            }
            catch (error) {
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
        api.on('kill', async (res) => {
            this.connected = false;
            this.stop();
            await this.browser.kill();
            res({ success: true });
            await sleep_1.default(500);
            process.exit(0);
            return null;
        });
        api.on('start', async (res) => {
            this.start();
            return res({ success: true });
        });
        api.on('deserialize', async (res) => {
            return res({ success: true, data: this.deserialize() });
        });
        api.on('openpage', (res, data) => {
            let plugin = data.plugin;
            let page = this.pluginData[plugin];
            let village = data.village;
            if (page.pluginSetup.hasPage && page.page) {
                if (page.pageControl) {
                    let handlers = [];
                    let input = callback => handlers.push(callback);
                    let output = data => this.pluginOutput(village, plugin, data);
                    if (page.pageControl.pauseTicks) {
                        this.hold(village, true);
                    }
                    let storage = get_storage_1.default(socket, plugin, village);
                    this.runpage[village] = page.pageControl.server(this.browser.scoped(village), input, output, storage, util_1.default);
                    socket.on(`page-${plugin}-${village}`, data => {
                        handlers.forEach(handler => handler(data));
                    });
                }
                return res({ success: true, page: page.page, runtime: page.pageControl ? page.pageControl.client.toString() : '' });
            }
            else {
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
        api.on('reload', async (res) => {
            await Hack.setup();
            plugin_loader_1.default(this);
            return res({ success: true });
        });
    }
    static from(input, api, socket) {
        return new Hack(input, api, socket);
    }
    static setup() {
        return new Promise(async (resolve) => {
            Hack.PLUGINS = await plugin_loader_1.default();
            return resolve();
        });
    }
    // functions
    setup() {
        return new Promise(async (resolve, reject) => {
            try {
                this.status = 'opeining virtual browser';
                this.browser = new browser_1.Browser(this);
                await this.browser.start();
                this.status = 'created virtual browser';
                await create_session_1.default(this);
                this.status = 'logged in to tribal wars (' + this.config.serverCode + ')';
                await multi_village_1.default(this);
                this.status = 'loaded multivillage strategy';
                // handle multiple villages
                (async () => {
                    await sleep_1.default(500);
                    this.status = 'preloading plugins';
                    for (let village of this.villages) {
                        this.browser.defaultPage = village.id;
                        for (let plugin of this.config.plugins) {
                            let meta = this.pluginData[plugin];
                            if (meta.pre) {
                                await meta.pre(this, get_storage_1.default(this.socket, plugin, village.id), plugin_require_provider_1.default(this.pluginData, meta.requires), util_1.default);
                            }
                        }
                    }
                    this.status = 'ready';
                    this.start();
                })();
                return resolve();
            }
            catch (error) {
                return reject(error);
            }
        });
    }
    start() {
        let ticks = 0;
        this.status = 'running';
        let tickdata = {};
        (async () => {
            while (this.status == 'running') {
                try {
                    let data = await this.tick(ticks, tickdata);
                    this.defaultOutput('tick', data);
                    let tick = {};
                    for (let vid in data) {
                        tick[vid] = {};
                        for (let plugin in data[vid]) {
                            tick[vid][plugin] = data[vid][plugin];
                        }
                    }
                    for (let vid in tickdata) {
                        if (!tick[vid]) {
                            tick[vid] = {};
                        }
                        for (let plugin in tickdata[vid]) {
                            if (!tick[vid][plugin]) {
                                tick[vid][plugin] = tickdata[vid][plugin];
                            }
                        }
                    }
                    tickdata = tick;
                }
                catch (error) {
                    console.log('tick failed');
                }
                ticks++;
                await sleep_1.default(1000);
            }
        })();
    }
    tick(ticks, tickdata) {
        return new Promise(async (resolve) => {
            let all = {};
            for (let village of this.villages) {
                if (this.holdPages[village.id]) {
                    all[village.id] = {};
                    continue;
                }
                let data = {};
                tickdata[village.id] = tickdata[village.id] || {};
                this.browser.defaultPage = village.id;
                for (let plugin of this.config.plugins) {
                    let script = this.pluginData[plugin];
                    // handle tick rate
                    if (ticks % script.tickrate !== 0) {
                        continue;
                    }
                    if (script.pluginSetup.hasTicks && this.connected) {
                        try {
                            let storage = get_storage_1.default(this.socket, plugin, village.id);
                            let run = script.run(this, storage, plugin_require_provider_1.default(tickdata[village.id], script.requires), util_1.default)
                                .catch(err => console.log("tick threw", plugin, err));
                            let time = sleep_1.default(15000, {});
                            let output = await Promise.race([run, time]);
                            if (JSON.stringify(output) == '{}') {
                                console.log('plugin tick timed out:', plugin);
                            }
                            data[plugin] = output;
                            tickdata[village.id][plugin] = data[plugin];
                        }
                        catch (error) {
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
    gotoScreen(screen, villageid, page, additions) {
        let addstr = '';
        if (additions) {
            Object.keys(additions).forEach(key => {
                addstr += `&${key}=${additions[key]}`;
            });
        }
        if (this.screen != screen || addstr) {
            let browser = page ? this.browser.scoped(page) : this.browser;
            let villageId = villageid || browser.defaultPage;
            return browser.open(`${this.config.serverCode}.${this.config.serverUrl}/game.php?village=${villageId}&screen=${screen}${addstr}`);
        }
    }
    hold(village, value) {
        this.holdPages[village] = value;
    }
    pause() {
        this.stop();
        this.status = 'paused';
    }
    kill() {
        return new Promise(async (resolve) => {
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
    getVillage(id) {
        return this.villages.find(village => village.id == id);
    }
    // getter / setter
    get status() {
        return this._status;
    }
    set status(v) {
        this._status = v;
        this.defaultOutput('status', v);
    }
    get screen() {
        try {
            return this.browser.url.match(/screen=(\w+)/)[1];
        }
        catch (e) {
            return 'ERROR';
        }
    }
}
exports.Hack = Hack;
