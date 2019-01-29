import * as puppeteer from 'puppeteer';


export interface IApi {
    on(url: string, callback: IApiListenerCallback): void;
}

export interface IApiListener {
    url: string;
    callback: IApiListenerCallback;
}


enum res { good = 'true' }
export interface IApiListenerCallback {
    (res: (data?: IApiResponseData) => res, body?: any): res | Promise<res>;
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
    run?(hack: Hack, storage: IStorage, requires: IPluginOutputMap): Promise<IPluginOutput>;
    pre?(hack: Hack, storage: IStorage, requires: IPluginOutputMap): Promise<void>;
    name: string;
    description: string;
    pluginSetup: {
        hasWidget: boolean;
        hasPage: boolean;
        hasTicks: boolean;
    }
    requires: string[];
    page?: string;
    pageControl?: {
        pauseTicks: boolean;
        server: (
            hack: Browser,
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

export interface IStorage {
    get<T = any>(name: string, defaultValue?: T): Promise<T>;
    set(name: string, data: any): Promise<void>;
}


export interface IHackConfig {
    serverCode: string;
    serverUrl: string;
    map: string;
    plugins: string[];
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

export interface Hack {
    //villageId: string;
    browser: Browser;
    pluginData: PluginRequireData;
    status: IStatus;
    screen: string;
    start(): void;
    tick(): Promise<any>;
    gotoScreen(screen: string): Promise<void>;
    hold(): void;
    pause(): void;
    kill(): Promise<void>;
    stop(): Promise<void>;
    deserialize(): Promise<any>;
}

interface Browser {
    page: puppeteer.Page;
    pages: {[key: string]: puppeteer.Page};
    url: string;
    defaultPage: string;
    start(): Promise<void>;
    open(url: string): Promise<void>;
    type(selector: string, data: string): Promise<void>;
    select<T = string>(selector: string, output: string): Promise<T>;
    select<T = { [key: string]: string }>(selector: string, output: string[]): Promise<T>;
    select<T = string>(selector: string[], output: string): Promise<T[]>;
    select<T = { [key: string]: string }>(selector: string[], output: string[]): Promise<T[]>;
    selectMultiple<T = string>(selector: string, output: string): Promise<T[]>;
    selectMultiple<T = { [key: string]: string }>(selector: string, output: string[]): Promise<T[]>;
    exit(): Promise<void>;
    click(selector: string): Promise<void>;
    click(coords: { x: number, y: number }): Promise<void>;
    cookie(name: string): Promise<puppeteer.Cookie>;
    screenshot(options?: puppeteer.Base64ScreenShotOptions): Promise<any>;
    kill(): Promise<void>;
}