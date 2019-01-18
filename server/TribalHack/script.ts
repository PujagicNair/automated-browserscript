import * as cp from "child_process";
import { IHackConfig, ISocket } from "./interfaces";

export class Script {
    private runtime: cp.ChildProcess;
    private listeners = [];
    private apiout = 0;
    private running = false;

    constructor(private data: IHackConfig) {
        this.create();
    }

    send(url: string, data?: any) {
        return new Promise<any>(resolve => {
            let res = this.apiout++;
            this.once({ type: 'api', response: res }, function(data) {
                return resolve(data);
            });
            this.runtime.send({ fn: 'api', args: [res, url, data] });
        });
    }

    socket: ISocket = {
        on: (action: string, callback) => {
            return this.on({ type: 'socket', action }, function(data) {
                return callback(data);
            });
        },
        emit: (action: string, data: any) => {
            this.runtime.send({ fn: 'socket', args: [action, data] });
        },
        off: (action: string, callback?) => {
            this.off({ type: 'socket', action }, callback);
        }
    }

    kill() {
        this.running = false;
        this.runtime.kill();
    }

    start() {
        if (!this.running) {
            this.create(); 
        }
    }

    private create() {
        this.runtime = cp.fork('compiled/script');
        this.runtime.on('message', data => this.emit(data));
        this.running = true;
        this.runtime.send({ fn: 'init', args: [this.data] });
    }

    private on(listen: any, callback) {
        this.listeners.push({ listen, callback });
    }

    private once(listen: any, callback) {
        this.listeners.push({ listen, callback, once: true });
    }

    private off(listen: any, callback?: any) {
        this.listeners = this.listeners.filter(handler => {
            let matchkeys = !Object.keys(handler.listen).some(key => {
                return handler.listen[key] != listen[key];
            });
            if (matchkeys && (handler.callback == (callback || handler.callback))) {
                return false;
            } else {
                return true;
            }
        })
    }

    private emit(action: any) {
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