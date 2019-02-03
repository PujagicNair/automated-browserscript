import * as fs from 'fs-extra';
import * as path from 'path';

let files_to_copy = fs.readdirSync(path.join(__dirname, '..', 'hack', 'plugins')).filter(file => file.endsWith('.html'));

for (let htmlFile of files_to_copy) {
    fs.copyFileSync(path.join(__dirname, '..', 'hack', 'plugins', htmlFile), path.join(__dirname, 'hack', 'plugins', htmlFile));
}

let plugins = fs.readdirSync(path.join(__dirname, 'hack', 'plugins')).filter(plugin => plugin.endsWith('.js'));

for (let plugin of plugins) {
    let content = fs.readFileSync(path.join(__dirname, 'hack', 'plugins', plugin)).toString();
    let hasChanged = false;
    content = content.replace(/['"`]~.+?['"`]/g, function(snip) {
        let file = snip.replace(/^.+?(\w)/, '$1').slice(0, -1);
        hasChanged = true;
        let fout = fs.readFileSync(path.join(__dirname, 'hack', 'plugins', file)).toString();
        fout = fout.replace(/(\n|\s+)/g, ' ').replace(/"/g, "\\\"");
        return `"${fout}"`;
    });
    if (hasChanged) {
        fs.writeFileSync(path.join(__dirname, 'hack', 'plugins', plugin), content);
    }
}

for (let htmlFile of files_to_copy) {
    fs.unlinkSync(path.join(__dirname, 'hack', 'plugins', htmlFile));
}