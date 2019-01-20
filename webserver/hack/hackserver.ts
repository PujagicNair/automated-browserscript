import * as request from 'request';
import * as io from 'socket.io-client';

export default class HackServer {

    private socket;
    scripts: string[];
    private listeners = [];

    constructor(private address: string, private integrity: string) {
        this.scripts = [];
    }
    
    connect() {
        return new Promise(async (resolve, reject) => {
            let resolved = false;
            this.socket = io.connect(this.address, <any>{ extraHeaders: { integrity: this.integrity } });
            this.socket.on('verified', value => {
                if (value) {
                    this.socket.on('transfer', (name: string, action: string, data: any) => {
                        this.listeners.filter(listener => listener.name == name && listener.action == action).forEach(listener => {
                            listener.callback(data);
                        });
                    });
                    if (!resolved) {
                        resolved = true;
                        return resolve();
                    }
                } else {
                    if (!resolved) {
                        resolved = true;
                        return reject('failed to connect to ' + this.address + ': invalide integrity');
                    }
                }
            });
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    return reject('failed to connect to ' + this.address + ': no signal after 5 seconds');
                }
            }, 5000);
        });
    }

    private post(url: string, body: any) {
        return new Promise<any>(resolve => {
            request.post(this.address + url, { json: body, headers: { integrity: this.integrity } }, (_err, _res, body) => {
                return resolve(body);
            });
        });
    }

    private get(url: string) {
        return new Promise<any>(resolve => {
            request.get(this.address + url, { headers: { integrity: this.integrity } }, (_err, _res, body: any) => {
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
                        console.log('listen', name, action);
                        
                        this.listeners.push({ name, action, callback });
                    },
                    emit: (action: string, data?: any) => {
                        this.socket.emit('transfer-' + name, action, data);
                    }
                }
                this.scripts.push(name);
                return resolve(runtime);
            } else {
                return reject(ret.message);
            }
        });
    }

    query(name: string, type: 'status' | 'lasttick') {
        return this.get('/' + type + "?name=" + name);
    }
}

interface IRuntime {
    on: (action: 'default' | 'widget' | 'plugin' | 'storage', callback: Function) => void;
    emit: (action: string, data?: any) => void;
}

interface IHackConfig {
    serverCode: string;
    serverUrl: string;
    map: string;
    plugins: string[];
    username: string;
    password: string;
}