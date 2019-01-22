
export interface ISocket {
    on(action: string, callback: (data?: any) => void): void;
    emit(action: string, data?: any): void;
    off(action: string, callback?: (data?: any) => void): void;
}


export interface IStorage {
    get<T = any>(name: string, defaultValue?: T): Promise<T>;
    set(name: string, data: any): Promise<void>;
}

interface IPluginConfig {
    [key: string]: string;
}

export interface IHackConfig {
    serverCode: string;
    serverUrl: string;
    map: string;
    plugins: string[];
    plugin_config: {
        [name: string]: IPluginConfig;
    }
    username: string;
    password: string;
}