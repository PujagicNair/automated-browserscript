import { IStorage, ISocket } from "../interfaces";

export default function getStorage(socket: ISocket, plugin: string, villageID: string): IStorage {
    return {
        get: (key: string, defaultValue?) => {
            return new Promise(async resolve => {
                let responseAddr = `storage-${Math.random().toString().replace('0.', '')}-${Date.now()}`;
                socket.on(responseAddr, data => {
                    socket.off(responseAddr);
                    return resolve(data);
                });
                socket.emit('storage', { key, defaultValue, responseAddr, plugin, villageID, method: 'get' });
            });
        },
        set: (key: string, data: any) => {
            return new Promise(async resolve => {
                let responseAddr = `storage-${Math.random().toString().replace('0.', '')}-${Date.now()}`;
                socket.on(responseAddr, () => {
                    socket.off(responseAddr);
                    return resolve();
                });
                socket.emit('storage', { key, value: data, responseAddr, plugin, villageID, method: 'set' });
            });
        }
    }
}