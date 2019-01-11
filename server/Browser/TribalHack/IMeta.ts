import { TribalHack } from "./index";

export interface IMeta {
    name: string;
    description: string;
    pluginSetup?: {
        hasWidget?: boolean;
        hasPage?: boolean;
    }
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
    required?: boolean;
    values?: string[];
}

export interface HackPlugin {
    run(hack: TribalHack, data: HackPluginData, config: any): Promise<any>;
    meta: IMeta;
    userconfig: any;
}

export interface HackPluginData {
    [name: string]: HackPlugin;
}