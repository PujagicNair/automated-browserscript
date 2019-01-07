import { Browser } from "../index";
import createSession, { Credentials } from "./create_session";

const sleep = ms => new Promise(r => setTimeout(r, ms));

declare var document: {
    getElementById(id: string): anyElement;
    querySelector(sel: string): anyElement;
    querySelectorAll(sel: string): Array<anyElement>;
};

export interface anyElement extends HTMLElement {
    [key: string]: any;
}

export enum EServer {
    DE151 = 'de161'
}

export class TribalHack {

    villageId: string;

    constructor(private server: EServer, private credentials: Credentials, private output?: (action: string, ...adds: any[]) => void) {
        if (!this.output) {
            this.output = (...args) => {};
        }
    }

    setup(browser: Browser) {
        return new Promise(async resolve => {
            await createSession(browser, this.credentials, this.output);
            return resolve();
        });
    }

    private urlOf(target: string) {
        return `/game.php?village=${this.villageId}&screen=${target}`
    }

    start() {

    }

    tick() {

    }

    check() {

    }

    pause() {

    }

    stop() {

    }

}