"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
class Browser {
    constructor() {
    }
    start() {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            this.browser = yield puppeteer_1.default.launch({ defaultViewport: { width: 1003, height: 730 }, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            this.page = (yield this.browser.pages())[0];
            yield this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36');
            return resolve();
        }));
    }
    open(url) {
        return this.page.goto('https://' + url);
    }
    type(selector, data) {
        return this.page.type(selector, data);
    }
    select(selector, output) {
        if (typeof selector == "string" && typeof output == "string") {
            return this.page.evaluate(({ selector, output }) => {
                return document.querySelector(selector)[output];
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
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            yield this.page.close();
            yield this.browser.close();
            return resolve();
        }));
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
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let cookies = yield this.page.cookies();
            let cookie = cookies.find(cookie => cookie.name == name);
            return resolve(cookie);
        }));
    }
    screenshot(options) {
        return this.page.screenshot(options);
    }
    get url() {
        return this.page.url();
    }
}
exports.Browser = Browser;
