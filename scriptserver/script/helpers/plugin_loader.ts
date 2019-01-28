import * as fs from 'fs-extra';
import * as path from 'path';
import { PluginRequireData, IPlugin } from '../interfaces';
import { Hack } from '../hack';
import hasAllRequired from './has_all_required';

export default function loadPlugins(): Promise<PluginRequireData>;
export default function loadPlugins(hack: Hack): void;
export default function loadPlugins(hack?: Hack): any {
    if (!hack) {
        return new Promise(async resolve => {
            let pluginFiles = fs.readdirSync(path.join(__dirname, '..', 'plugins'));
        
            let plugins: PluginRequireData = {};
    
            for (let file of pluginFiles) {
                let filepath = path.resolve(__dirname, '..', 'plugins', file);
                if (require.cache[filepath]) {
                    delete require.cache[filepath];
                }
                let script: IPlugin = await import(filepath);
                plugins[script.name] = script;
            }
            
            return resolve(plugins);
        });
    } else {
        let data: PluginRequireData = {};
        for (let plugin of hack.config.plugins) {
            let script = Hack.PLUGINS[plugin];
            data[plugin] = script;
            if (script.requires && !hasAllRequired(data, script.requires)) {
                throw new Error('failed to load plugin: ' + plugin + '! Some required module doesnt exist');
            }
        }
        hack.pluginData = data;
    }
}

