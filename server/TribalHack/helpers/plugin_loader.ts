import * as fs from 'fs-extra';
import * as path from 'path';
import { PluginRequireData, IPlugin } from '../interfaces';
import { TribalHack } from '..';
import hasAllRequired from './has_all_required';
import orderPlugins from './order_plugins';

export default function loadPlugins(): Promise<PluginRequireData>;
export default function loadPlugins(hack: TribalHack): Promise<void>;
export default function loadPlugins(hack?: TribalHack): Promise<any> {
    return new Promise(async (resolve, reject) => {
        
        let pluginFiles = fs.readdirSync(path.join(__dirname, '..', 'plugins'));
        
        let plugins: PluginRequireData = {};

        for (let file of pluginFiles) {
            let script: IPlugin = await import('../plugins/' + file.slice(0, -3));
            plugins[script.name] = script;
        }

        if (!hack) {
            return resolve(plugins);
        }

        let plugsOrdered = orderPlugins(plugins, hack.plugins);
        

        let data: PluginRequireData = {};
        for (let plugin of plugsOrdered) {
            let script = plugins[plugin];
            data[plugin] = script;
            if (script.requires && !hasAllRequired(data, script.requires)) {
                return reject('failed to load plugin: ' + plugin + '! Some required module doesnt exist. For more information checkout the manual page of the plugin');
            }
            
        }

        hack.pluginData = data;
        hack.plugins = plugsOrdered;
        return resolve();
    });
}

