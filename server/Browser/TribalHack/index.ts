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
    'de161': { url: 'die-staemme.de/', map: '161' }
}

export class TribalHack {

    _id: string;
    villageId: string;
    browser: Browser;
    server: { url: string, map: string };
    plugins: string[];
    pluginData: HackPluginData;
    config;

    private isRunning = false;

    constructor(input?: any, public output?: (action: string, ...adds: any[]) => void) {
        if (input) {
            this.config = input;
            this.plugins = Object.keys(this.config.plugins).filter(key => this.config.plugins[key]);
    
            this.server = SERVERS[this.config.server + this.config.map];
            if (!this.server) {
                throw new Error('Server or Map invalide');
            }
        }
        if (!this.output) {
            this.output = (...args) => {};
        }
    }

    static SERVERS;
    static PLUGINS;

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
                await createSession(this);
                await loadPlugins(this);
                return resolve();
            } catch (error) {
                return reject(error);
            }

        });
    }

    start() {
        this.isRunning = true;
        (async () => {
            while (this.isRunning) {
                await this.tick();
                await sleep(5000);
            }
        })();
    }

    tick() {
        return new Promise(async resolve => {
            let data = {};
            console.log('--------------------');
            
            for (let plugin of this.plugins) {
                let script = this.pluginData[plugin];
                let output = await script.run(this, data, '{}');
                data[plugin] = output;
            }
            
            return resolve();
        });
    }

    check() {}

    pause() {}

    stop() {
        this.isRunning = false;
    }

    private static serialize(data: any, output?: (action: string, ...adds: any[]) => void): TribalHack {
        let hack = new TribalHack(null, output);
        Object.keys(data).forEach(key => {
            hack[key] = data[key];
        })
        return hack;
    }

    private deserialize(): any {
        let save = {};
        ['villageId', 'server', 'plugins', 'config'].forEach(prop => {
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
                await model.save();
            }
            return resolve(model);
        });
    }

    static load(objectID: string, output?: (action: string, ...adds: any[]) => void): Promise<TribalHack> {
        return new Promise(async resolve => {
            let doc = await TribalHackModel.findById(objectID);
            return resolve(TribalHack.serialize(doc, output));
        });
    }

}