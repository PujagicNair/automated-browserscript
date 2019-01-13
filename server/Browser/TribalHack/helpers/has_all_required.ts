import { PluginRequireData } from "../interfaces";

export default function hasAllRequired(data: PluginRequireData, required: string[]) {
    return !required.some(plugin => !data[plugin]);
}