import { IStorage, ISocket } from "../interfaces";

let storageIndex = 0;
export default function getStorage(socket: ISocket, plugin: string): IStorage {
    return {
        get: (key: string, defaultValue?) => {
            return new Promise(async resolve => {
                let responseAddr = `storage-${storageIndex++}-${Date.now()}`;
                socket.on(responseAddr, data => {
                    socket.off(responseAddr);
                    return resolve(data);
                });
                socket.emit('storage', { key, defaultValue, responseAddr, plugin, method: 'get' });
            });
        },
        set: (key: string, data: any) => {
            return new Promise(async resolve => {
                let responseAddr = `storage-${storageIndex++}-${Date.now()}`;
                socket.on(responseAddr, () => {
                    socket.off(responseAddr);
                    return resolve();
                });
                socket.emit('storage', { key, value: data, responseAddr, plugin, method: 'set' });
            });
        }
    }
}