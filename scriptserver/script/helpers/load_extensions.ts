import { Hack } from "../hack";
import getStorage from "./get_storage";
import providePluginsFor from "./plugin_require_provider";
import util from "./util";

export default async function loadExtensions(hack: Hack, plugin: string, villageId: string, tickdata: any) {
    let scext = Object.keys(hack.pluginData).filter(tr => hack.pluginData[tr].extends == plugin)
    let extensions = {};
    for (let ext of scext) {
        if (hack.pluginData[ext]) {
            let storage = getStorage(hack.socket, plugin, villageId);
            let exts = await loadExtensions(hack, ext, villageId, tickdata);
            let requires = providePluginsFor(tickdata[villageId], hack.pluginData[ext].requires);
            let runned = await hack.pluginData[ext].run(hack, storage, requires, util, exts);
            extensions[ext] = runned;
        }
    }
    return extensions;
}