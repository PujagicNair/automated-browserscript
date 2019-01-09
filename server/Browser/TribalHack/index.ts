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

export enum EServer {
    DE161 = '__de161'
}

const SERVERS = {
    [EServer.DE161]: { url: 'https://die-staemme.de/', map: '161' }
}

export class TribalHack {

    villageId: string;
    browser: Browser;
    server: { url: string, map: string };
    plugins: string[];
    pluginData: HackPluginData;

    constructor(server: EServer, public credentials: Credentials, public output?: (action: string, ...adds: any[]) => void) {
        this.server = SERVERS[server];
        if (!this.output) {
            this.output = (...args) => {};
        }
    }

    setup(browser : Browser) {
        this.browser = browser;
        return new Promise(async (resolve, reject) => {
            try {
                //await createSession(this);
                await this.loadPlugins();
                return resolve();
            } catch (error) {
                return reject(error);
            }

        });
    }

    loadPlugins(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
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

    start() {}

    tick() {
        return new Promise(async resolve => {
            for (let plugin of this.plugins) {
                let script = this.pluginData[plugin];
                await script.run(this, providePluginsFor(this.pluginData, script.meta.requires), {});
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