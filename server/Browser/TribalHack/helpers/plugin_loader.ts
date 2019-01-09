import * as fs from 'fs-extra';
import * as path from 'path';
import { HackPluginData, HackPlugin } from '../IMeta';
import { TribalHack } from '../index';
import hasAllRequired from '../helpers/has_all_required';

export default function loadPlugins(hack: TribalHack): Promise<HackPluginData> {
    return new Promise(async (resolve, reject) => {
        let pluginFiles = fs.readdirSync(path.join(__dirname, '..', 'functions'));
        let plugins: HackPluginData = {};
        for (let file of pluginFiles) {
            let script: HackPlugin = await import('../functions/' + file);
            plugins[script.meta.name] = script;
        }
        let data: HackPluginData = {};
        /*for (let plugin of plugins) {
            let script: HackPlugin = await import('../functions/' + plugin);
            let name = script.meta.name;
            if (hack.plugins.indexOf(name) != -1) {
                data[name] = script;
                console.log(name, script.meta.requires, Object.keys(data));
                
                if (script.meta.requires && !hasAllRequired(data, script.meta.requires)) {
                    return reject('failed to load plugin: ' + plugin + '! Some required module doesnt exist. For more information checkout the manual page of the plugin');
                }

                hack.output('action', 'plugin loaded', plugin);
            }
        }*/

        for (let plugin of hack.plugins) {
            let script = plugins[plugin];
            data[plugin] = script;
            if (script.meta.requires && !hasAllRequired(data, script.meta.requires)) {
                return reject('failed to load plugin: ' + plugin + '! Some required module doesnt exist. For more information checkout the manual page of the plugin');
            }
        }

        hack.output('done loading plugins')

        return resolve(data);
    });
}

