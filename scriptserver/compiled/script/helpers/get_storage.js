"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getStorage(socket, plugin, villageID) {
    return {
        get: (key, defaultValue) => {
            return new Promise(async (resolve) => {
                let responseAddr = `storage-${Math.random().toString().replace('0.', '')}-${Date.now()}`;
                socket.on(responseAddr, data => {
                    socket.off(responseAddr);
                    return resolve(data);
                });
                socket.emit('storage', { key, defaultValue, responseAddr, plugin, villageID, method: 'get' });
            });
        },
        set: (key, data) => {
            return new Promise(async (resolve) => {
                let responseAddr = `storage-${Math.random().toString().replace('0.', '')}-${Date.now()}`;
                socket.on(responseAddr, () => {
                    socket.off(responseAddr);
                    return resolve();
                });
                socket.emit('storage', { key, value: data, responseAddr, plugin, villageID, method: 'set' });
            });
        },
        /*pushArray: (key: string, data: any) => {
            return new Promise(async resolve => {
                let responseAddr = `storage-${Math.random().toString().replace('0.', '')}-${Date.now()}`;
                socket.on(responseAddr, () => {
                    socket.off(responseAddr);
                    return resolve();
                });
                socket.emit('storage', { key, value: data, responseAddr, plugin, villageID, method: 'push' });
            });
        },*/
        remove: (key) => {
            return new Promise(async (resolve) => {
                let responseAddr = `storage-${Math.random().toString().replace('0.', '')}-${Date.now()}`;
                socket.on(responseAddr, () => {
                    socket.off(responseAddr);
                    return resolve();
                });
                socket.emit('storage', { key, responseAddr, plugin, villageID, method: 'remove' });
            });
        }
    };
}
exports.default = getStorage;
