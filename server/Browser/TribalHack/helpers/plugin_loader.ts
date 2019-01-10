import * as fs from 'fs-extra';
import * as path from 'path';
import { HackPluginData, HackPlugin } from '../IMeta';
import { TribalHack } from '../index';
import hasAllRequired from '../helpers/has_all_required';
import orderPlugins from './order_plugins';

export default function loadPlugins(): Promise<HackPluginData>;
export default function loadPlugins(hack: TribalHack): Promise<void>;
export default function loadPlugins(hack?: TribalHack): Promise<any> {
    return new Promise(async (resolve, reject) => {
        
        let pluginFiles = fs.readdirSync(path.join(__dirname, '..', 'functions'));
        let plugins: HackPluginData = {};

        for (let file of pluginFiles) {
            let script: HackPlugin = await import('../functions/' + file);
            plugins[script.meta.name] = script;
        }

        if (!hack) {
            return resolve(plugins);
        }

        let plugsOrdered = orderPlugins(plugins, hack.plugins);
        

        let data: HackPluginData = {};
        for (let plugin of plugsOrdered) {
            let script = plugins[plugin];
            data[plugin] = script;
            if (script.meta.requires && !hasAllRequired(data, script.meta.requires)) {
                return reject('failed to load plugin: ' + plugin + '! Some required module doesnt exist. For more information checkout the manual page of the plugin');
            }
        }

        hack.pluginData = data;
        hack.plugins = plugsOrdered;
        return resolve();
    });
}

