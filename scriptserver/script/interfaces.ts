import { Hack } from "./hack";
import { Page } from "puppeteer";
import { Browser } from "./browser";

export interface IApi {
    on(url: string, callback: IApiListenerCallback): void;
}

export interface IApiListener {
    url: string;
    callback: IApiListenerCallback;
}

enum res { }
export type IApiListenerCallback = (res: (data?: IApiResponseData) => res, body?: any) => res | Promise<res>;

export interface IVillage {
    name: string;
    id: string;
    x?: string;
    y?: string;
    points?: number;
    coords?: string;
}

export interface IUtil {
    distance(village1: Coord, village2: Coord): number;
    distance(village1: string, village2: string): number;
    distance(village1: Coord, village2: string): number;
    distance(village1: string, village2: Coord): number;
    troopSpeed(troops: ITroop[]): number;
    travelSpeed(troops: ITroop[], dist: number): number;
    parseCoords(coord: string | Coord): Coord;
    time: ITimeUtil;
    troops: ITroop[];
    random(max: number): number;
    random(min: number, max: number): number;
    random<T>(arr: T[]): T;
}

interface Coord {
    x?: number;
    y?: number;
}


interface ITroop {
    key: string;
    img: string;
    costs: any;
    space: number;
    speed: number;
}

interface ITimeUtil {
    minutes(amt: number | string): number;
    seconds(amt: number | string): number;
    hours(amt: number | string): number;
    fromString(str: string): number;
    toLocaleString(ms: number): string;
    toFormatString(ms: number): string;
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

type IExtensionArg = { [name: string]: IExtension };
type IExtension = (...args: any[]) => Promise<any>;

export interface IPlugin {
    type: "plugin" | "util" | "extension";
    extends?: string;
    run?(hack: Hack, storage: IStorage, requires: IPluginOutputMap, util: IUtil, extensions: IExtensionArg): Promise<IPluginOutput>;
    pre?(hack: Hack, storage: IStorage, requires: IPluginOutputMap, util: IUtil): Promise<void>;
    name: string;
    tickrate: number;
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
            browser: Browser,
            input: (
                callback: (data) => void
            ) => void,
            output: (data) => void,
            storage: IStorage,
            util: IUtil
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

export type IStatus = 'offline' | 'ready' | 'running' | 'onhold' | 'paused' | string;

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
export type PluginOutput = (village: string, plugin: string, data: any) => void;
export type widgetOutput = (village: string, data: { [plugin: string]: any }) => void;