import * as request from 'request';
import * as io from 'socket.io-client';
import * as fs from 'fs-extra';
import * as path from 'path';

let RUNTIMES = {};
export default class HackServer {

    private socket;
    scripts: string[];
    connected: boolean = false;
    private listeners = []; // socket listeners
    private handlers = []; // status listeners

    constructor(private address: string, private integrity: string) {
        this.scripts = [];
    }
    
    connect() {
        return new Promise(async (resolve, reject) => {
            this.socket = io.connect(this.address, <any>{ extraHeaders: { integrity: this.integrity } });
            this.socket.on('connect', () => {
                this.socket.on('verified', async value => {
                    if (value) {
                        this.socket.on('transfer', (name: string, action: string, data: any) => {
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
                        let runtimes: string[] = (await this.get('/runtimes')).runtimes;
                        for (let name of runtimes) {
                            let runtime = {
                                on: (action: string, callback: Function) => {
                                    this.listeners.push({ name, action, callback });
                                },
                                emit: (action: string, data?: any) => {
                                    this.socket.emit('transfer-' + name, action, data);
                                }
                            }
                            RUNTIMES[name] = runtime;
                        }
                        
                        // sync plugins with server
                        let plugFiles = fs.readdirSync(path.join(__dirname, 'plugins')).filter(file => fs.lstatSync(path.join(__dirname, 'plugins', file)).isFile());
                        let form = request.post(this.address + '/plugins', {
                            headers: { integrity: this.integrity, "content-type": "multipart/form-data" }
                        }, (_err, _res, body) => {
                            if (JSON.parse(body).success) {
                                return resolve();
                            } else {
                                return reject('failed to update plugins');
                            }
                        }).form();
                        for (let plug of plugFiles) {
                            form.append('file', fs.createReadStream(path.join(__dirname, 'plugins', plug)));
                        }
                    } else {
                        return reject('invalide integrity');
                    }
                });
            });
        });
    }

    change(callback) {
        this.handlers.push(callback);
    }

    private trigger(key: string, value: any) {
        this.handlers.forEach(handler => {
            handler(key, value);
        });
    }

    private post(url: string, body: any) {
        return new Promise<any>(resolve => {
            request.post(this.address + url, { json: body, headers: { integrity: this.integrity } }, (_err, _res, body) => {
                if (typeof body == "string") {
                    body = JSON.parse(body);
                }
                return resolve(body);
            });
        });
    }

    private get(url: string) {
        return new Promise<any>(resolve => {
            request.get(this.address + url, { headers: { integrity: this.integrity } }, (_err, _res, body: any) => {
                if (typeof body == "string") {
                    body = JSON.parse(body);
                }
                return resolve(body);
            });
        });
    }

    ping(): Promise<number> {
        return new Promise(async resolve => {
            let body = await this.get('/ping');
            return resolve(Date.now() - body);
        });
    }

    runScript(name: string, config: IHackConfig) {
        return new Promise<IRuntime>(async (resolve, reject) => {
            let ret = await this.post('/run?name=' + name, config);
            if (ret.success) {
                let runtime = {
                    on: (action: string, callback: Function) => {
                        this.listeners.push({ name, action, callback });
                    },
                    emit: (action: string, data?: any) => {
                        this.socket.emit('transfer-' + name, action, data);
                    },
                    pid: ret.pid
                }
                RUNTIMES[name] = runtime;
                this.scripts.push(name);
                return resolve(runtime);
            } else {
                return reject(ret.message);
            }
        });
    }

    runtime(name: string): IRuntime {
        return RUNTIMES[name];
    }

    query(name: string, type: QueryArg, adds?: { [key: string]: string }) {
        let params = '';
        if (adds) {
            for (let key in adds) {
                params += `&${key}=${adds[key]}`;
            }
        }
        return this.get('/' + type + "?name=" + name + params);
    }
}

type QueryArg = 'status' | 'lasttick' | 'openpage' | 'closepage' | 'kill' | 'villages';

interface IRuntime {
    on: (action: 'default' | 'widget' | 'plugin' | 'storage', callback: Function) => void;
    emit: (action: string, data?: any) => void;
    pid: number;
}

interface IHackConfig {
    serverCode: string;
    serverUrl: string;
    map: string;
    plugins: string[];
    username: string;
    password: string;
}