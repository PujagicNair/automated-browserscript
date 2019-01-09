import { HackPluginData } from "../IMeta";

export default function hasAllRequired(data: HackPluginData, required: string[]) {
    return !required.some(plugin => !data[plugin]);
}