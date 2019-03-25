"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
class Script {
    constructor(data) {
        this.data = data;
        this.listeners = [];
        this.apiout = 0;
        this.running = false;
        this.living = false;
        this.socket = {
            on: (action, callback) => {
                return this.on({ type: 'socket', action }, function (data) {
                    return callback(data);
                });
            },
            emit: (action, data) => {
                if (this.living) {
                    this.runtime.send({ fn: 'socket', args: [action, data] });
                }
            },
            off: (action, callback) => {
                this.off({ type: 'socket', action }, callback);
            }
        };
        this.create();
    }
    send(url, data) {
        return new Promise((resolve, reject) => {
            if (this.living) {
                let res = this.apiout++;
                this.once({ type: 'api', response: res }, function (data) {
                    return resolve(data);
                });
                this.runtime.send({ fn: 'api', args: [res, url, data] });
            }
            else {
                return reject('script not alive');
            }
        });
    }
    exit() {
        this.runtime.kill();
    }
    start() {
        if (!this.running) {
            this.create();
        }
    }
    create() {
        this.runtime = cp.fork(path.join(__dirname, 'script', 'index.js'));
        this.runtime.on('message', data => this.emit(data));
        this.running = true;
        this.living = true;
        this.runtime.send({ fn: 'init', args: [this.data] });
        this.runtime.on('exit', () => this.living = false);
    }
    on(listen, callback) {
        this.listeners.push({ listen, callback });
    }
    once(listen, callback) {
        this.listeners.push({ listen, callback, once: true });
    }
    off(listen, callback) {
        this.listeners = this.listeners.filter(handler => {
            let matchkeys = !Object.keys(handler.listen).some(key => {
                return handler.listen[key] != listen[key];
            });
            if (matchkeys && (handler.callback == (callback || handler.callback))) {
                return false;
            }
            else {
                return true;
            }
        });
    }
    emit(action) {
        this.listeners.filter(handler => {
            return !Object.keys(handler.listen).some(key => {
                return handler.listen[key] != action[key];
            });
        }).forEach(handler => {
            handler.callback(action.data);
            if (handler.once) {
                this.listeners = this.listeners.filter(listener => listener != handler);
            }
        });
    }
}
exports.Script = Script;
