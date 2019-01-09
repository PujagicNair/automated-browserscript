import { TribalHack } from "./index";

export interface IMeta {
    name: string;
    description: string;
    costs?: number;
    config?: IConfigValue[];
    requires?: string[];
    addition?: string;
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
    values?: string[];
}

export interface HackPlugin {
    run(hack: TribalHack, data: HackPluginData, config: any): Promise<void>;
    meta: IMeta;
    userconfig: any;
}

export interface HackPluginData {
    [name: string]: HackPlugin;
}