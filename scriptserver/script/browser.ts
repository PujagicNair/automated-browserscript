import puppeteer from 'puppeteer';
import sleep from './helpers/sleep';
import { Hack } from './hack';

export class Browser {

    constructor(public hack: Hack) {}

    //page: puppeteer.Page;
    private browser: puppeteer.Browser;

    pages: { [key: string]: puppeteer.Page } = {};
    defaultPage: string = "default";

    start() {
        return new Promise(async (resolve, reject) => {
            try {
                this.browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1003, height: 730 } });
                /*this.browser = await puppeteer.launch({ devtools: false, headless: true, defaultViewport: { width: 1003, height: 730 }, args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--remote-debugging-port=9222'
                ]});*/
                
                this.pages["default"] = (await this.browser.pages())[0];
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36');
                return resolve();
            } catch (error) {
                return reject('failed to open puppeteer');
            }
        });
    }

    newPage(key: string): Promise<puppeteer.Page> {
        return new Promise(async resolve => {
            let page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36');
            this.pages[key] = page;
            return resolve(page);
        });
    }

    open(url: string) {
        return new Promise(async resolve => {
            await this.page.goto('https://' + url, { waitUntil: 'domcontentloaded' });
            return resolve();
        });
    }

    type(selector: string, data: string, empty?: boolean) {
        return new Promise(async resolve => {
            if (empty) {
                await this.page.evaluate(selector => document.querySelector(selector).value = "", selector);
            }
            await this.page.type(selector, data);
            return resolve();
        });
    }

    reload() {
        return this.page.reload({ waitUntil: 'domcontentloaded' });
    }

    scoped(page?: string): Browser {
        page = page || this.defaultPage;
        let run = new Browser(this.hack);
        run.browser = this.browser;
        run.defaultPage = page;
        run.pages = { [page]: this.pages[page] };
        return run;
    }

    clone() {
        return
    }

    select<T = string>(selector: string, output: string): Promise<T>;
    select<T = { [key: string]: string }>(selector: string, output: string[]): Promise<T>;
    select<T = string>(selector: string[], output: string): Promise<T[]>;
    select<T = { [key: string]: string }>(selector: string[], output: string[]): Promise<T[]>;
    select<T = any>(selector: string | string[], output: string | string[]): Promise<T | T[]> {
        if (typeof selector == "string" && typeof output == "string") {
            return this.page.evaluate(({ selector, output }) => {
                let elem = document.querySelector(selector);
                return (elem || {})[output];
            }, { selector, output });
        } else if (typeof selector == "string" && Array.isArray(output)) {
            return this.page.evaluate(({ selector, output }) => {
                let elem = document.querySelector(selector);
                let out = {};
                for (let prop of output) {
                    out[prop] = elem[prop];
                }
                return out;
            }, { selector, output });
        } else if (Array.isArray(selector) && typeof output == "string") {
            return this.page.evaluate(({ selector, output }) => {
                let out = [];
                for (let sel of selector) {
                    let elem = document.querySelector(sel);
                    out.push(elem[output]);
                }
                return out;
            }, { selector, output });
        } else if (Array.isArray(selector) && Array.isArray(output)) {
            return this.page.evaluate(({ selector, output }) => {
                let out = [];
                for (let sel of selector) {
                    let elem = document.querySelector(sel);
                    let data = {};
                    for (let prop of output) {
                        data[prop] = elem[prop];
                    }
                    out.push(data);
                }
                return out;
            }, { selector, output });
        } else {
            throw new Error("Unknown selector or output defined");
        }
    }

    selectMultiple<T = any>(selector: string, output: string): Promise<T[]>;
    selectMultiple<T = any>(selector: string, output: string[]): Promise<T[]>;
    selectMultiple<T = any>(selector: string, output: string | string[]): Promise<T[]> {
        if (typeof selector == "string" && typeof output == "string") {
            return this.page.evaluate(({ selector, output }) => {
                let out = [];
                for (let elem of document.querySelectorAll(selector)) {
                    out.push(elem[output]);
                }
                return out;
            }, { selector, output });
        } else if (typeof selector == "string" && Array.isArray(output)) {
            return this.page.evaluate(({ selector, output }) => {
                let out = [];
                for (let elem of document.querySelectorAll(selector)) {
                    let data = {};
                    for (let prop of output) {
                        data[prop] = elem[prop];
                    }
                    out.push(data);
                }
                return out;
            }, { selector, output });
        } else {
            throw new Error("Unknown selector or output defined");
        }
    }

    exit() {
        return new Promise(async resolve => {
            await this.page.close();
            await this.browser.close();
            return resolve();
        });    
    }

    click(selector: string): Promise<void>;
    click(coords: { x: number, y: number }): Promise<void>;
    click(where: any): Promise<void> {
        if (typeof where == 'string') {
            return this.page.click(where);
        } else if (typeof where.x == "number" && typeof where.y == "number") {
            return this.page.mouse.click(where.x, where.y);
        } else {
            throw new Error('no target to click on');
        }
    }

    cookie(name: string) {
        return new Promise<puppeteer.Cookie>(async resolve => {
            let cookies = await this.page.cookies();
            let cookie = cookies.find(cookie => cookie.name == name);
            return resolve(cookie);
        });
    }

    screenshot(options?: puppeteer.Base64ScreenShotOptions) {
        return this.page.screenshot(options);
    }

    kill() {
        return new Promise(async resolve => {
            await sleep(500);
            await this.browser.close();
            await sleep(500);
            return resolve();
        });
    }

    get url(): string {
        return this.page.url();
    }

    get page() {
        return this.pages[this.defaultPage];
    }

    get wsEndpoint(): string {
        return this.browser.wsEndpoint();
    }
}