"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const sleep_1 = __importDefault(require("./helpers/sleep"));
class Browser {
    constructor(hack) {
        this.hack = hack;
        this.pages = {};
        this.defaultPage = "default";
    }
    start() {
        return new Promise(async (resolve, reject) => {
            try {
                this.browser = await puppeteer_1.default.launch({ headless: false, defaultViewport: { width: 1003, height: 730 } });
                /*this.browser = await puppeteer.launch({ devtools: false, headless: true, defaultViewport: { width: 1003, height: 730 }, args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    //'--remote-debugging-port=40' + this.hack.config.map
                ]});*/
                this.pages["default"] = (await this.browser.pages())[0];
                await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36');
                return resolve();
            }
            catch (error) {
                return reject('failed to open puppeteer');
            }
        });
    }
    newPage(key) {
        return new Promise(async (resolve) => {
            let page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36');
            this.pages[key] = page;
            return resolve(page);
        });
    }
    open(url) {
        return new Promise(async (resolve) => {
            await this.page.goto('https://' + url, { waitUntil: 'domcontentloaded' });
            return resolve();
        });
    }
    type(selector, data, empty) {
        return new Promise(async (resolve) => {
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
    scoped(page) {
        page = page || this.defaultPage;
        let run = new Browser(this.hack);
        run.browser = this.browser;
        run.defaultPage = page;
        run.pages = { [page]: this.pages[page] };
        return run;
    }
    clone() {
        return;
    }
    select(selector, output) {
        if (typeof selector == "string" && typeof output == "string") {
            return this.page.evaluate(({ selector, output }) => {
                let elem = document.querySelector(selector);
                return (elem || {})[output];
            }, { selector, output });
        }
        else if (typeof selector == "string" && Array.isArray(output)) {
            return this.page.evaluate(({ selector, output }) => {
                let elem = document.querySelector(selector);
                let out = {};
                for (let prop of output) {
                    out[prop] = elem[prop];
                }
                return out;
            }, { selector, output });
        }
        else if (Array.isArray(selector) && typeof output == "string") {
            return this.page.evaluate(({ selector, output }) => {
                let out = [];
                for (let sel of selector) {
                    let elem = document.querySelector(sel);
                    out.push(elem[output]);
                }
                return out;
            }, { selector, output });
        }
        else if (Array.isArray(selector) && Array.isArray(output)) {
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
        }
        else {
            throw new Error("Unknown selector or output defined");
        }
    }
    selectMultiple(selector, output) {
        if (typeof selector == "string" && typeof output == "string") {
            return this.page.evaluate(({ selector, output }) => {
                let out = [];
                for (let elem of document.querySelectorAll(selector)) {
                    out.push(elem[output]);
                }
                return out;
            }, { selector, output });
        }
        else if (typeof selector == "string" && Array.isArray(output)) {
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
        }
        else {
            throw new Error("Unknown selector or output defined");
        }
    }
    exit() {
        return new Promise(async (resolve) => {
            await this.page.close();
            await this.browser.close();
            return resolve();
        });
    }
    click(where) {
        if (typeof where == 'string') {
            return this.page.click(where);
        }
        else if (typeof where.x == "number" && typeof where.y == "number") {
            return this.page.mouse.click(where.x, where.y);
        }
        else {
            throw new Error('no target to click on');
        }
    }
    cookie(name) {
        return new Promise(async (resolve) => {
            let cookies = await this.page.cookies();
            let cookie = cookies.find(cookie => cookie.name == name);
            return resolve(cookie);
        });
    }
    screenshot(options) {
        return this.page.screenshot(options);
    }
    kill() {
        return new Promise(async (resolve) => {
            await sleep_1.default(500);
            await this.browser.close();
            await sleep_1.default(500);
            return resolve();
        });
    }
    get url() {
        return this.page.url();
    }
    get page() {
        return this.pages[this.defaultPage];
    }
}
exports.Browser = Browser;
