import { PluginRequireData } from "../interfaces";

export default function providePluginsFor(data: PluginRequireData, plugins: string[] = []) {
    //return data;
    let end: PluginRequireData = {};
    for (let plugin of plugins) {
        end[plugin] = data[plugin];
    }
    return end;
}