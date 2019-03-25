"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hack_1 = require("./hack");
process.on('message', function (data) {
    runtime[data.fn](...data.args);
});
process.on('unhandledRejection', function (err) {
    console.log('threw', err);
});
const output = {
    api(response, data) {
        return process.send({ type: 'api', response, data });
    },
    socket(action, data) {
        return process.send({ type: 'socket', action, data });
    }
};
let listeners = [];
let socket = {
    on: function (action, callback) {
        listeners.push({ action, callback });
    },
    emit: function (action, data) {
        return output.socket(action, data);
    },
    off: function (action, callback) {
        listeners = listeners.filter(listener => !(listener.action == action && listener.callback == (callback || listener.callback)));
    }
};
let apiListeneres = [];
let api = {
    on: function (url, callback) {
        apiListeneres.push({ url, callback });
    }
};
const runtime = {
    async init(dataset) {
        await hack_1.Hack.setup();
        hack_1.Hack.from(dataset, api, socket);
    },
    socket(action, data) {
        listeners.filter(handler => handler.action == action).forEach(handler => handler.callback(data));
    },
    api(response, url, data) {
        let res = function (body) {
            return output.api(response, body);
        };
        let success = false;
        apiListeneres.filter(listener => listener.url == url).forEach(listener => {
            success = true;
            listener.callback(res, data);
        });
        if (!success) {
            return output.api(response, { success: false, message: 'not found' });
        }
    }
};
