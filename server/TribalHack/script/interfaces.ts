import { Hack } from "./hack";

export interface IApi {
    on(url: string, callback: IApiListenerCallback): void;
}

export interface IApiListener {
    url: string;
    callback: IApiListenerCallback;
}


enum res { good = 'true' }
export interface IApiListenerCallback {
    (res: (data: IApiResponseData) => res, body?: any): res | Promise<res>;
}

export interface IApiResponseData {
    success: boolean;
    [key: string]: any;
}

export interface ISocket {
    on(action: string, callback: (data?: any) => void): void;
    emit(action: string, data?: any): void;
    off(action: string, callback?: (data?: any) => void): void;
}

export interface IPlugin {
    run?(hack: Hack, storage: IStorage, requires: IPluginOutputMap, config: IPluginConfig): Promise<IPluginOutput>;
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
            hack: Hack,
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

export interface IExtension {
    name: string;
    description: string;
    plugin: string;
    pageControl: {
        server?: (
            hack: Hack,
            input: (
                callback: (data) => void
            ) => void,
            output: (data) => void,
            storage: IStorage
        ) => void;
        client?: (
            window: Window,
            input: (
                callback: (data) => void
            ) => void,
            output: (data) => void
        ) => void;
    };
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

export interface IRuntime {
    [_id: string]: Hack;
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

export type DefaultOutput = (action: string, data: any) => void;
export type PluginOutput = (plugin: string, data: any) => void;