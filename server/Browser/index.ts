import * as phantom from 'phantom';
import { IBrowserOptions } from './TribalHack/interfaces';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export class Browser {
    constructor(private options: IBrowserOptions = { loadImages: 'no' }) {}
    isStarted = false;
    private isStarting = false;
    private tab: Webpage;
    private browser: phantom.PhantomJS;
    url: string;
    start() {
        let opts = Object.keys(this.options).reduce((acc, key) => {
            let arr = "--" + key.split(/([A-Z][a-z]+)/).filter(v => v).map(v => v.toLowerCase()).join("-");
            acc.push(arr + (this.options[key] != null ? '=' + this.options[key] : ''))
            return acc;
        }, []);

        if (this.isStarting) {
            return;
        }

        return new Promise(async resolve => {
            this.isStarting = true;
            this.browser = await phantom.create(opts);
            this.tab = await <any>this.browser.createPage();
            this.tab.on('onError', console.log)
            await this.tab.on('onUrlChanged', newUrl => this.url = newUrl);
            this.isStarted = true;
            return resolve();
        });
    }

    open(url: string) {
        return new Promise(async resolve => {
            await this.tab.on('onLoadFinished', async () => {
                await this.tab.off('onLoadFinished');
                return resolve();
            });
            this.tab.open('https://' + url);
        });
    }

    restart() {
        return new Promise(async resolve => {
            await this.exit();
            await this.start();
            return resolve();
        });
    }

    exit() {
        return new Promise(async resolve => {
            this.isStarted = false;
            await this.tab.close();
            await this.browser.exit();
            this.isStarting = false;
            return resolve();
        });
    }

    exec<T = any>(script: string | ((...args) => any)): Promise<T> {
        if (typeof script == "string") {
            return this.tab.evaluateJavaScript<T>(script);
        } else {
            return this.tab.evaluate(script);
        }
    }

    click(selector: string) {
        return this.exec(`function() { document.querySelector("${selector}").click(); }`);
    }

    cookies() {
        return this.tab.cookies();
    }

    cookie(name: string) {
        return new Promise<Cookie>(async resolve => {
            let cookies = await this.cookies();
            let found = cookies.find(cookie => cookie.name == name);
            return resolve(found);
        });
    }

    screenshot(name: string) {
        return this.tab.renderBase64(name);
    }
}

interface Webpage extends phantom.WebPage {
    evaluateJavaScript<T = any>(script: string): Promise<T>;
    cookies(): Promise<Cookie[]>;
}

type Cookie = { name: string, value: string };