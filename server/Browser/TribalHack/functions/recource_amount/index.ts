import { TribalHack } from "../../index";
import { IMeta, HackPluginData } from "../../IMeta";

export function run(hack: TribalHack, data: HackPluginData, pluginOptions: any): Promise<void> {
    return new Promise(async resolve => {
        console.log(meta.name, Object.keys(data));
        return resolve();
    });
}

export const meta: IMeta = {
    name: 'recource-amount',
    description: 'executes a action when you reached the configured recources',
    config: [
        { label: "wood", name: "wood", type: "number", description: "leave empty for no checks" },
        { label: "stone", name: "stone", type: "number", description: "leave empty for no checks" },
        { label: "iron", name: "iron", type: "number", description: "leave empty for no checks" },
        { label: "action", name: "action", description: "what should happen when you reach this amount ?", type: "radio", values: ["email", "sms"] },
        { label: "email", name: "email", description: "Email the message is sent to (only if action is email)", type: "email" },
        { label: "number", name: "sms", description: "Number the message is sent to (only if action is sms)", type: "string" }
    ],
    requires: ['recource-sync']
}