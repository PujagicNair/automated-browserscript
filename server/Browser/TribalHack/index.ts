import { Browser } from "../index";
import * as fs from 'fs-extra';
import * as path from 'path';
import createSession from "./helpers/create_session";
import loadPlugins from './helpers/plugin_loader';
import { HackPluginData } from "./IMeta";
import providePluginsFor from "./helpers/plugin_require_provider";
import { Connection } from "mongoose";
import { createModels, TribalHackModel, MTribalHackDocument } from "./models/MHack";

let sleep = ms => new Promise(r => setTimeout(r, ms));

declare var document : {
    getElementById(id : string) : anyElement;
    querySelector(sel : string) : anyElement;
    querySelectorAll(sel : string) : Array < anyElement >;
};

export interface anyElement extends HTMLElement {
    [key : string] : any;
}

const SERVERS = {
    'de160': { url: 'die-staemme.de/', map: '160' },
    'de161': { url: 'die-staemme.de/', map: '161' },
    'de162': { url: 'die-staemme.de/', map: '162' },
    'de163': { url: 'die-staemme.de/', map: '163' }
}

type defaultOutput = (scriptID: string, action: string, data: any) => void;
type pluginOutput = (scriptID: string, plugin: string, data: any) => void;

export class TribalHack {

    _id: string;
    villageId: string;
    browser: Browser;
    server: { url: string, map: string };
    plugins: string[];
    pluginData: HackPluginData;
    pluginSetup: any;
    config;
    private model: MTribalHackDocument;

    constructor(input: any) {
        if (input) {
            this.config = input;
            this.config.plugin_config = this.config.plugin_config || {};
            this.plugins = Object.keys(this.config.plugins).filter(key => this.config.plugins[key]);
    
            this.server = SERVERS[this.config.server + this.config.map];
            if (!this.server) {
                throw new Error('Server or Map invalide');
            }
        }
    }

    static SERVERS;
    static PLUGINS;
    static RUNNING: { [key: string]: TribalHack } = {};
    static defaultOutput: defaultOutput;
    static widgetOutput: pluginOutput;
    static pluginOutput: pluginOutput;
    
    private _status : string = 'offline';
    public get status() : string {
        return this._status;
    }
    public set status(v : string) {
        this._status = v;
        TribalHack.defaultOutput(this._id, 'status', v);
    }
    

    static setup(conn: Connection) {
        return new Promise(async resolve => {
            createModels(conn);
            let pluginData = await loadPlugins();
            TribalHack.PLUGINS = Object.keys(pluginData).map(key => pluginData[key].meta);
            TribalHack.SERVERS = JSON.parse(fs.readFileSync(path.join(__dirname, 'models', 'servers.json')).toString());
            return resolve();
        });
    }

    setup() {
        return new Promise(async (resolve, reject) => {
            try {
                this.browser = new Browser(this.config.browserOptions);
                await this.browser.start();
                await loadPlugins(this);
                await createSession(this);
                if (this._id) {
                    this.model = await TribalHackModel.findById(this._id);
                } else {
                    this.model = new TribalHackModel(this.deserialize());
                    this._id = this.model._id;
                }
                this.status = 'ready';
                TribalHack.RUNNING[this._id] = this;
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
                await this.tick();
                await sleep(10000);
            }
        })();
    }

    tick() {
        return new Promise(async resolve => {
            let data = {};
            for (let plugin of this.plugins) {
                let script = this.pluginData[plugin];
                let output = await script.run(this, data, this.config.plugin_config[plugin]);
                if (this.pluginSetup[plugin] && this.pluginSetup[plugin].hasWidget) {
                    TribalHack.widgetOutput(this._id, plugin, output);
                }
                if (this.pluginSetup[plugin] && this.pluginSetup[plugin].hasPage) {
                    TribalHack.pluginOutput(this._id, plugin, output);
                }
                data[plugin] = output;
            }
            
            return resolve();
        });
    }

    forClient() {

    }

    check() {}

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

    private static serialize(data: any): TribalHack {
        let hack = new TribalHack(data.config);
        Object.keys(data).forEach(key => {
            hack[key] = data[key];
        });
        hack._id = data._id;
        return hack;
    }

    deserialize(): any {
        let save = {};
        ['villageId', 'server', 'plugins', 'config', 'status', '_id', 'pluginSetup'].forEach(prop => {
            save[prop] = this[prop];
        });
        return JSON.parse(JSON.stringify(save));
    }

    save(): Promise<MTribalHackDocument> {
        return new Promise(async resolve => {
            let ser = this.deserialize();
            Object.keys(ser).forEach(key => {
                this.model[key] = ser[key];
            });
            await this.model.save();
            return resolve(this.model);
        });
    }

    static load(objectID: string): Promise<TribalHack> {
        return new Promise(async resolve => {
            let doc = await TribalHackModel.findById(objectID);
            return resolve(TribalHack.serialize(doc));
        });
    }

}