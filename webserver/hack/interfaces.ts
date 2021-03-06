import * as puppeteer from 'puppeteer';

export interface IApi {
    on(url: string, callback: IApiListenerCallback): void;
}

export interface IApiListener {
    url: string;
    callback: IApiListenerCallback;
}

enum res { }
export type IApiListenerCallback = (res: (data?: IApiResponseData) => res, body?: any) => res | Promise<res>;

export interface IApiResponseData {
    success: boolean;
    [key: string]: any;
}

export interface ISocket {
    on(action: string, callback: (data?: any) => void): void;
    emit(action: string, data?: any): void;
    off(action: string, callback?: (data?: any) => void): void;
}

type IInput = (callback: (data: any) => void) => void;
type IOutput = (data: any) => void;
type IServerRuntimeOutput = void | (() => void);
export type IRunFunction = (hack: Hack, storage: IStorage, requires: IPluginOutputMap, util: IUtil, extensions: IExtensionArg) => Promise<IPluginOutput>;
export type IPreFunction = (hack: Hack, storage: IStorage, requires: IPluginOutputMap, util: IUtil) => Promise<void>;


export interface IPlugin {
    type: "plugin" | "util" | "extension";
    run?: IRunFunction | string;
    pre?: IPreFunction | string;
    name: string;
    description: string;
    pluginSetup: {
        hasWidget: boolean;
        hasPage: boolean;
        hasTicks: boolean;
    }
    extends?: string;
    requires?: string[];
    page?: string;
    pageControl?: IPageControl | string;
    widget?: string;
    tickrate?: number;
}

type IExtensionArg = { [name: string]: IExtension };
export type IExtension = (...args: any[]) => Promise<any>;

export interface IPageControl {
    pauseTicks: boolean;
    server: (browser: Browser, input: IInput, output: IOutput, storage: IStorage, util: IUtil) => IServerRuntimeOutput;
    client: (window: Window, input: IInput, output: IOutput) => void;
}


export interface IStorage {
    get<T = any>(name: string, defaultValue?: T): Promise<T>;
    set(name: string, data: any): Promise<void>;
    pushArray(name: string, data: any): Promise<void>;
    remove(name: string): Promise<void>;
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
    browser: Browser;
    pluginData: PluginRequireData;
    status: IStatus;
    screen: string;
    villages: IVillage[];
    start(): void;
    tick(): Promise<any>;
    gotoScreen(screen: string, villageid?: string, page?: string, additions?: { [key: string]: string }): Promise<void>;
    hold(page: string, value: boolean): void;
    kill(): Promise<void>;
    stop(): Promise<void>;
    deserialize(): Promise<any>;
    getVillage(id: string): IVillage;
}

interface IUtil {
    distance(village1: Coord, village2: Coord): number;
    distance(village1: string, village2: string): number;
    distance(village1: Coord, village2: string): number;
    distance(village1: string, village2: Coord): number;
    troopSpeed(troops: ITroop[]): number;
    travelSpeed(troops: ITroop[], dist: number): number;
    parseCoords(coord: string | Coord): Coord;
    time: ITimeUtil;
    random(max: number): number;
    random(min: number, max: number): number;
    random<T>(arr: T[]): T;
    troops: ITroop[];

}

interface ITroop {
    key: string;
    img: string;
    costs: any;
    speed: number;
    space: number;
}

interface ITimeUtil {
    minutes(amt: number | string): number;
    seconds(amt: number | string): number;
    hours(amt: number | string): number;
    fromString(str: string): number;
    toLocaleString(ms: number): string;
    toFormatString(ms: number): string;
}

export interface Browser {
    hack: Hack;
    page: puppeteer.Page;
    pages: {[key: string]: puppeteer.Page};
    url: string;
    defaultPage: string;
    start(): Promise<void>;
    scoped(page?: string): Browser;
    newPage(key: string): Promise<puppeteer.Page>
    open(url: string): Promise<void>;
    type(selector: string, data: string, empty?: boolean): Promise<void>;
    select<T = string>(selector: string, output: string): Promise<T>;
    select<T = { [key: string]: string }>(selector: string, output: string[]): Promise<T>;
    select<T = string>(selector: string[], output: string): Promise<T[]>;
    select<T = { [key: string]: string }>(selector: string[], output: string[]): Promise<T[]>;
    selectMultiple<T = string>(selector: string, output: string): Promise<T[]>;
    selectMultiple<T = { [key: string]: string }>(selector: string, output: string[]): Promise<T[]>;
    exit(): Promise<void>;
    click(selector: string): Promise<void>;
    click(coords: Coord): Promise<void>;
    cookie(name: string): Promise<puppeteer.Cookie>;
    screenshot(options?: puppeteer.Base64ScreenShotOptions): Promise<any>;
    kill(): Promise<void>;
    reload(): Promise<void>;
}

interface Coord {
    x?: number;
    y?: number;
}

interface IVillage extends Coord {
    name: string;
    id: string;
    points?: number;
    coords: string;
}