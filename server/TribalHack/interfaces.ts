import { TribalHack } from "./index";

export interface IPlugin {
    run?(hack: TribalHack, storage: IStorage, requires: IPluginOutputMap, config: IPluginConfig): Promise<IPluginOutput>;
    name: string;
    description: string;
    pluginSetup: {
        hasWidget: boolean;
        hasPage: boolean;
        hasTicks: boolean;
    }
    config: IConfigValue[];
    requires: string[];
    page?: string;
    pageControl?: {
        pauseTicks: boolean;
        server: (
            hack: TribalHack,
            input: (
                callback: (data) => void
            ) => void,
            output: (data) => void,
            storage: IStorage
        ) => void | (() => void);
        client: (
            window: Window,
            input: (
                callback: (data) => void
            ) => void,
            output: (data) => void
        ) => void;
    };
    widget?: string;
}

export interface ISocket {
    on(action: string, callback: (data?: any) => void): void;
    emit(action: string, data?: any): void;
    off(action: string, callback?: (data?: any) => void): void;
}

export interface ISetup {
    
}

export interface IStorage {
    get<T = any>(name: string, defaultValue?: T): Promise<T>;
    set(name: string, data: any): Promise<void>;
}

interface IConfigValue {
    name: string;
    label: string;
    type: 'string' | 'number' | 'radio' | 'email' | 'checkbox';
    description?: string;
    reconfigurable?: boolean;
    min?: number;
    max?: number;
    max_length?: number;
    required?: boolean;
    values?: string[];
}

interface IPluginConfig {
    [key: string]: string;
}

export interface IHackConfig {
    server: string;
    map: string;
    plugins: {
        [name: string]: boolean;
    };
    plugin_config: {
        [name: string]: IPluginConfig;
    }
    username: string;
    password: string;
    browserOptions: IBrowserOptions;
    ticks: string;
}

export interface IBrowserOptions {
    loadImages: 'yes' | 'no';
}

export interface IServer {
    url: string;
    map: string;
}

export interface IRuntime {
    [_id: string]: TribalHack;
}

export type IStatus = 'offline' | 'ready' | 'running' | 'onhold' | 'paused';

export interface PluginRequireData {
    [name: string]: IPlugin;
}

export interface IPluginOutput {
    [key: string]: any;
}

export interface IPluginOutputMap {
    [name: string]: IPluginOutput;
} 