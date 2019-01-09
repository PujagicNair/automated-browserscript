import { HackPluginData } from "../IMeta";

export default function providePluginsFor(data: HackPluginData, plugins: string[] = []) {
    let end: HackPluginData = {};
    for (let plugin of plugins) {
        end[plugin] = data[plugin];
    }
    return end;
}