"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = __importStar(require("request"));
const io = __importStar(require("socket.io-client"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
let RUNTIMES = {};
class HackServer {
    constructor(address, integrity) {
        this.address = address;
        this.integrity = integrity;
        this.connected = false;
        this.listeners = [];
        this.handlers = [];
        this.scripts = [];
    }
    connect() {
        return new Promise(async (resolve, reject) => {
            this.socket = io.connect(this.address, { extraHeaders: { integrity: this.integrity } });
            this.socket.on('connect', () => {
                this.socket.on('verified', async (value) => {
                    if (value) {
                        this.socket.on('transfer', (name, action, data) => {
                            this.listeners.filter(listener => listener.name == name && listener.action == action).forEach(listener => {
                                listener.callback(data);
                            });
                        });
                        this.connected = true;
                        this.trigger('connected', true);
                        this.socket.on('disconnect', () => {
                            this.connected = false;
                            RUNTIMES = {};
                            this.socket.off('transfer');
                            this.socket.off('verified');
                            this.trigger('connected', false);
                        });
                        let runtimes = (await this.get('/runtimes')).runtimes;
                        for (let name of runtimes) {
                            let runtime = {
                                on: (action, callback) => {
                                    this.listeners.push({ name, action, callback });
                                },
                                emit: (action, data) => {
                                    this.socket.emit('transfer-' + name, action, data);
                                }
                            };
                            RUNTIMES[name] = runtime;
                        }
                        let plugFiles = fs.readdirSync(path.join(__dirname, 'plugins')).filter(file => fs.lstatSync(path.join(__dirname, 'plugins', file)).isFile());
                        let form = request.post(this.address + '/plugins', {
                            headers: { integrity: this.integrity, "content-type": "multipart/form-data" }
                        }, (_err, _res, body) => {
                            if (JSON.parse(body).success) {
                                return resolve();
                            }
                            else {
                                return reject('failed to update plugins');
                            }
                        }).form();
                        for (let plug of plugFiles) {
                            form.append('file', fs.createReadStream(path.join(__dirname, 'plugins', plug)));
                        }
                    }
                    else {
                        return reject('invalide integrity');
                    }
                });
            });
        });
    }
    change(callback) {
        this.handlers.push(callback);
    }
    trigger(key, value) {
        this.handlers.forEach(handler => {
            handler(key, value);
        });
    }
    post(url, body) {
        return new Promise(resolve => {
            request.post(this.address + url, { json: body, headers: { integrity: this.integrity } }, (_err, _res, body) => {
                if (typeof body == "string") {
                    body = JSON.parse(body);
                }
                return resolve(body);
            });
        });
    }
    get(url) {
        return new Promise(resolve => {
            request.get(this.address + url, { headers: { integrity: this.integrity } }, (_err, _res, body) => {
                if (typeof body == "string") {
                    body = JSON.parse(body);
                }
                return resolve(body);
            });
        });
    }
    ping() {
        return new Promise(async (resolve) => {
            let body = await this.get('/ping');
            return resolve(Date.now() - body);
        });
    }
    runScript(name, config) {
        return new Promise(async (resolve, reject) => {
            let ret = await this.post('/run?name=' + name, config);
            if (ret.success) {
                let runtime = {
                    on: (action, callback) => {
                        this.listeners.push({ name, action, callback });
                    },
                    emit: (action, data) => {
                        this.socket.emit('transfer-' + name, action, data);
                    },
                    pid: ret.pid
                };
                RUNTIMES[name] = runtime;
                this.scripts.push(name);
                return resolve(runtime);
            }
            else {
                return reject(ret.message);
            }
        });
    }
    runtime(name) {
        return RUNTIMES[name];
    }
    query(name, type, adds) {
        let params = '';
        if (adds) {
            for (let key in adds) {
                params += `&${key}=${adds[key]}`;
            }
        }
        return this.get('/' + type + "?name=" + name + params);
    }
}
exports.default = HackServer;
