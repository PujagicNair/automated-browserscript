"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const hack_1 = require("../hack");
const has_all_required_1 = __importDefault(require("./has_all_required"));
function loadPlugins(hack) {
    if (!hack) {
        return new Promise(async (resolve) => {
            let pluginFiles = fs.readdirSync(path.join(__dirname, '..', 'plugins'));
            let plugins = {};
            for (let file of pluginFiles) {
                let filepath = path.resolve(__dirname, '..', 'plugins', file);
                if (require.cache[filepath]) {
                    delete require.cache[filepath];
                }
                let script = await Promise.resolve().then(() => __importStar(require(filepath)));
                plugins[script.name] = script;
            }
            return resolve(plugins);
        });
    }
    else {
        let data = {};
        for (let plugin of hack.config.plugins) {
            let script = hack_1.Hack.PLUGINS[plugin];
            data[plugin] = script;
            if (script.requires && !has_all_required_1.default(data, script.requires)) {
                throw new Error('failed to load plugin: ' + plugin + '! Some required module doesnt exist');
            }
        }
        hack.pluginData = data;
    }
}
exports.default = loadPlugins;
