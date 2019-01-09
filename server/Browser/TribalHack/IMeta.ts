import { TribalHack } from "./index";

export interface IMeta {
    name: string;
    description: string;
    costs?: number;
    config?: IConfig;
    requires?: string[];
    addition?: string;
}

interface IConfig {
    [field: string]: IConfigValue;
}

type IConfigValue = IConfigValueNumber | IConfigValueString | IConfigValueRadio | IConfigValueCheckbox;

interface ValueType {
    type: 'string' | 'number' | 'radio' | 'email' | 'checkbox';
    description?: string;
    reconfigurable?: boolean;
}

interface IConfigValueNumber extends ValueType {
    min?: number;
    max?: number;
}

interface IConfigValueString extends ValueType {
    max_length?: number;
}

interface IConfigValueRadio extends ValueType {
    values: string[];
}

interface IConfigValueCheckbox extends ValueType {
    values: string[];
}

export interface HackPlugin {
    run(hack: TribalHack, data: HackPluginData, config: any): Promise<void>;
    meta: IMeta;
    userconfig: any;
}

export interface HackPluginData {
    [name: string]: HackPlugin;
}