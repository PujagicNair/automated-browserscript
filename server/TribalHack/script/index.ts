import { Hack } from "./hack";
import { ISocket, IApi, IApiListener, IApiResponseData } from "./interfaces";

process.on('message', function(data) {
    runtime[data.fn](...data.args);
});

const output = {
    api(response: string, data: IApiResponseData): any {
        return process.send({ type: 'api', response, data });
    },
    socket(action: string, data: any) {
        return process.send({ type: 'socket', action, data });
    }
}

let listeners = [];
let socket: ISocket = {
    on: function(action: string, callback) {
        listeners.push({ action, callback });
    },
    emit: function(action: string, data) {
        return output.socket(action, data);
    },
    off: function(action: string, callback?) {
        listeners = listeners.filter(listener => (listener.action == action && listener.callback == (callback || listener.callback)));
    }
}

let apiListeneres: IApiListener[] = [];
let api: IApi = {
    on: function(url: string, callback) {
        apiListeneres.push({ url, callback });
    }
}


const runtime = {
    async init(dataset) {
        await Hack.setup();
        Hack.from(dataset, api, socket);
    },
    socket(action: string, data: any) {
        listeners.filter(handler => handler.action == action).forEach(handler => handler.callback(data));
    },
    api(response: string, url: string, data?: string) {
        let res = function(body: IApiResponseData) {
            return output.api(response, body);
        }
        let success = false;
        apiListeneres.filter(listener => listener.url == url).forEach(listener => {
            success = true;
            listener.callback(res, data);
        });
        if (!success) {
            return output.api(response, { success: false, message: 'not found' });
        }
    }
}