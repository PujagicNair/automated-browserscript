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

export class TribalHack {

    _id: string;
    villageId: string;
    browser: Browser;
    server: { url: string, map: string };
    plugins: string[];
    pluginData: HackPluginData;
    config;

    constructor(input: any, public output: (action: string, ...adds: any[]) => void) {
        if (input) {
            this.config = input;
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
    
    private _status : string = 'offline';
    public get status() : string {
        return this._status;
    }
    public set status(v : string) {
        this._status = v;
        this.output('status', this._id, v);
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
                this.status = 'ready';
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
                await sleep(5000);
            }
        })();
    }

    tick() {
        return new Promise(async resolve => {
            let data = {};
            for (let plugin of this.plugins) {
                let script = this.pluginData[plugin];
                let output = await script.run(this, data, this.config.plugin_config[plugin]);
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

    private static serialize(data: any, output: (action: string, ...adds: any[]) => void): TribalHack {
        let hack = new TribalHack(null, output);
        Object.keys(data).forEach(key => {
            hack[key] = data[key];
        });
        TribalHack.RUNNING[hack._id] = hack;
        return hack;
    }

    deserialize(): any {
        let save = {};
        ['villageId', 'server', 'plugins', 'config', 'status'].forEach(prop => {
            save[prop] = this[prop];
        });
        return JSON.parse(JSON.stringify(save));
    }

    save(): Promise<MTribalHackDocument> {
        return new Promise(async resolve => {
            let model;
            if (this._id) {
                model = await TribalHackModel.findByIdAndUpdate(this._id, this.deserialize());
            } else {
                model = new TribalHackModel(this.deserialize());
            }
            delete model.status;
            await model.save();
            return resolve(model);
        });
    }

    static load(objectID: string, output: (action: string, ...adds: any[]) => void): Promise<TribalHack> {
        return new Promise(async resolve => {
            let doc = await TribalHackModel.findById(objectID);
            return resolve(TribalHack.serialize(doc, output));
        });
    }

}