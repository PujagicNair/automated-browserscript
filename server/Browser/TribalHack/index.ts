import { Browser } from "..";
import * as fs from 'fs-extra';
import * as path from 'path';
import createSession from "./helpers/create_session";
import loadPlugins from './helpers/plugin_loader';
import { IPlugin, IServer, IRuntime, IStatus, PluginRequireData, IStorage, IHackConfig } from "./interfaces";
import { createModels, TribalHackModel, MTribalHackDocument, StorageModel } from "./models/MHack";
import providePluginsFor from "./helpers/plugin_require_provider";

let sleep = ms => new Promise(r => setTimeout(r, ms));

const SERVERS = {
    'de160': { url: 'die-staemme.de/', map: '160' },
    'de161': { url: 'die-staemme.de/', map: '161' },
    'de162': { url: 'die-staemme.de/', map: '162' },
    'de163': { url: 'die-staemme.de/', map: '163' }
}

type defaultOutput = (scriptID: string, action: string, data: any) => void;
type pluginOutput = (scriptID: string, plugin: string, data: any) => void;

export class TribalHack {

    // statics
    static SERVERS: IServer[] = [];
    static PLUGINS: IPlugin[] = [];
    static RUNNING: IRuntime = {};
    static defaultOutput: defaultOutput;
    static widgetOutput: pluginOutput;
    static pluginOutput: pluginOutput;

    static setup() {
        return new Promise(async resolve => {
            createModels();
            let pluginData = await loadPlugins();      
            TribalHack.PLUGINS = Object.keys(pluginData).map(key => pluginData[key]);
            TribalHack.SERVERS = JSON.parse(fs.readFileSync(path.join(__dirname, 'models', 'servers.json')).toString());
            return resolve();
        });
    }

    private static serialize(data: any): TribalHack {
        let hack = new TribalHack(data.config);
        Object.keys(data).forEach(key => {
            hack[key] = data[key];
        });
        hack._id = data._id;
        return hack;
    }

    static load(objectID: string): Promise<TribalHack> {
        return new Promise(async resolve => {
            let doc = await TribalHackModel.findById(objectID);
            return resolve(TribalHack.serialize(doc));
        });
    }

    // props
    _id: string;
    userID: string;
    villageId: string;
    browser: Browser;
    server: IServer;
    plugins: string[];
    pluginData: PluginRequireData;
    config: IHackConfig;

    // private
    private model: MTribalHackDocument;
    private _status : IStatus = 'offline';

    // constructor
    constructor(input: IHackConfig) {
        
        if (input) {
            this.config = input;
            this.plugins = Object.keys(this.config.plugins).filter(key => this.config.plugins[key]);
    
            this.server = SERVERS[this.config.server + this.config.map];
            if (!this.server) {
                throw new Error('Server or Map invalide');
            }
        } else {
            throw new Error('Failed to create a script: no config provided')
        }
    }

    // functions
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
            let storage: IStorage = {
                get: (key: string) => {
                    return new Promise(async resolve => {
                        let item = await StorageModel.findOne({ scriptID: this._id, userID: this.userID, key });
                        return resolve(item.data);
                    });
                },
                set: (key: string, data: any) => {
                    return new Promise(async resolve => {
                        let exist = await StorageModel.findOne({ scriptID: this._id, userID: this.userID, key });
                        if (exist) {
                            await exist.update({ data });
                        } else {
                            await new StorageModel({ key, scriptID: this._id, userID: this.userID, data }).save();
                        }
                        return resolve();
                    });
                }
            }
            for (let plugin of this.plugins) {
                let script = this.pluginData[plugin];
                if (script.run) {
                    let output = await script.run(this, storage, providePluginsFor(data, script.requires), null/*this.config.plugin_config[plugin]*/);
                    if (script.pluginSetup.hasWidget) {
                        TribalHack.widgetOutput(this._id, plugin, output);
                    }
                    if (script.pluginSetup.hasPage) {
                        TribalHack.pluginOutput(this._id, plugin, output);
                    }
                    data[plugin] = output;
                }
            } 
            return resolve();
        });
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

    deserialize(): any {
        let save = {};
        ['villageId', 'server', 'plugins', 'config', 'status', '_id', 'pluginData'].forEach(prop => {
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

    // getter / setter
    public get status() : IStatus {
        return this._status;
    }
    public set status(v : IStatus) {
        this._status = v;
        TribalHack.defaultOutput(this._id, 'status', v);
    }
}