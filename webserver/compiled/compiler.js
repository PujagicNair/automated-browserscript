"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const uglify = __importStar(require("uglify-es"));
let pathof = (...segs) => path.join(__dirname, 'hack', 'plugins', ...segs);
let pathofOld = (...segs) => path.join(__dirname, '..', 'hack', 'plugins', ...segs);
let files_to_copy = fs.readdirSync(pathofOld('includes')).filter(file => file.endsWith("html"));
for (let file of files_to_copy)
    fs.copyFileSync(pathofOld('includes', file), pathof('includes', file));
let plugins = fs.readdirSync(pathof()).filter(plugin => !fs.lstatSync(pathof(plugin)).isDirectory());
let incFiles = fs.readdirSync(pathof('includes'));
(async () => {
    let includes = {};
    for (let inc of incFiles) {
        let mimeType = inc.split('.').slice(-1)[0];
        if (mimeType == 'js') {
            let content = await Promise.resolve().then(() => __importStar(require(pathof('includes', inc))));
            let def = content.default;
            if (typeof def == 'object') {
                let done = '{\n';
                Object.keys(def).forEach(key => {
                    if (typeof def[key] == 'function') {
                        let code = def[key].toString().split("");
                        code.splice(9, 0, '__def_uf');
                        let uf = uglify.minify(code.join(''), { toplevel: false }).code;
                        uf = uf.replace(' __def_uf', '');
                        done += `${key}: ${uf},\n`;
                    }
                    else {
                        done += `${key}: ${def[key].toString()},\n`;
                    }
                });
                done = done.slice(0, -2);
                done += '\n}';
                includes[inc] = done;
            }
            else if (typeof def === 'function') {
                let code = def.toString().split("");
                code.splice(9, 0, '__def_uf');
                let uf = uglify.minify(code.join(''), { toplevel: false }).code;
                uf = uf.replace(' __def_uf', '');
                includes[inc] = uf;
            }
        }
        else if (mimeType == 'html') {
            let content = fs.readFileSync(pathof('includes', inc)).toString().replace(/(\n|\s+)/g, ' ');
            includes[inc] = "`" + content + "`";
        }
        else {
            console.log(mimeType, inc);
            throw new Error('unknown mime type');
        }
    }
    for (let plugin of plugins) {
        let content = fs.readFileSync(pathof(plugin)).toString();
        let hasChanged = false;
        content = content.replace(/['"`]~.+?['"`]/g, function (snip) {
            let file = snip.replace(/^.+?(\w)/, '$1').slice(0, -1);
            hasChanged = true;
            return includes[file];
        });
        if (hasChanged) {
            fs.writeFileSync(pathof(plugin), content);
        }
    }
})();
