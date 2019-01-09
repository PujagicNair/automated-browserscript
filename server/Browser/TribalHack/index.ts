import { Browser } from "../index";
import createSession, { Credentials } from "./helpers/create_session";
import loadPlugins from './helpers/plugin_loader';
import { HackPluginData } from "./IMeta";
import providePluginsFor from "./helpers/plugin_require_provider";

declare var document : {
    getElementById(id : string) : anyElement;
    querySelector(sel : string) : anyElement;
    querySelectorAll(sel : string) : Array < anyElement >;
};

export interface anyElement extends HTMLElement {
    [key : string] : any;
}

const SERVERS = {
    'de161': { url: 'https://die-staemme.de/', map: '161' }
}

export class TribalHack {

    villageId: string;
    browser: Browser;
    server: { url: string, map: string };
    plugins: string[];
    pluginData: HackPluginData;
    config;

    private isRunning = false;

    constructor(input, public output?: (action: string, ...adds: any[]) => void) {
        this.config = input;
        this.plugins = Object.keys(this.config.plugins).filter(key => this.config.plugins[key]);

        this.server = SERVERS[this.config.server + this.config.map];
        if (!this.server) {
            throw new Error('Server or Map invalide');
        }
        if (!this.output) {
            this.output = (...args) => {};
        }
    }

    setup() {
        return new Promise(async (resolve, reject) => {
            try {
                this.browser = new Browser(this.config.browserOptions);
                await this.browser.start();
                await createSession(this);
                this.pluginData = await loadPlugins(this);
                return resolve();
            } catch (error) {
                return reject(error);
            }

        });
    }

    private urlOf(target : string) {
        return `/game.php?village=${this.villageId}&screen=${target}`
    }

    start() {
        this.isRunning = true;
        /*(async () => {
            while (true) {
                //await sleep
            }
        })();*/
    }

    tick() {
        return new Promise(async resolve => {
            for (let plugin of this.plugins) {
                let script = this.pluginData[plugin];
                await script.run(this, providePluginsFor(this.pluginData, script.meta.requires), {});
                return resolve();
            }
        });
    }

    check() {}

    pause() {}

    stop() {}

    serialize(data: any): TribalHack {
        return null;
    }

    deserialize(): any {
        return null;
    }

}