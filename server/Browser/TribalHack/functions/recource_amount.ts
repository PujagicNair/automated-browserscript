import { TribalHack } from "../index";
import { IMeta, HackPluginData } from "../IMeta";

export function run(hack: TribalHack, data: HackPluginData, pluginOptions: any): Promise<void> {
    return new Promise(async resolve => {
        console.log(meta.name, Object.keys(data));
        return resolve();
    });
}

export const meta: IMeta = {
    name: 'recource-amount',
    description: 'executes a action when you reached the configured recources',
    config: {
        amount_wood: { type: 'number', description: 'leave empty for no checks' },
        amount_stone: { type: 'number', description: 'leave empty for no checks' },
        amount_iron: { type: 'number', description: 'leave empty for no checks' },
        action: {
            type: 'radio',
            values: ['email', 'sms', 'browser message'],
        },
        action_email: { type: 'email' },
        action_sms: { type: 'string' }
    }
}