import {Browser} from "../index";
import createSession, {Credentials} from "./create_session";

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

    villageId : string;
    private server: { url: string, map: string } ;

    constructor(server: EServer, private credentials : Credentials, private output?: (action : string, ...adds : any[]) => void) {
        this.server = SERVERS[server];
        if (!this.output) {
            this.output = (...args) => {};
        }
    }

    setup(browser : Browser) {
        return new Promise(async resolve => {
            await createSession(browser, this.server, this.credentials, this.output);
            return resolve();
        });
    }

    private urlOf(target : string) {
        return `/game.php?village=${this.villageId}&screen=${target}`
    }

    start() {}

    tick() {}

    check() {}

    pause() {}

    stop() {}

}