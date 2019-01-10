import { HackPluginData } from "../IMeta";

function swap(list, x, y) {
    let b = list[y];
    list[y] = list[x];
    list[x] = b;
}


export default function orderPlugins(plugins: HackPluginData, used: string[]): string[] {

    let neworder = [];

    used.forEach((elem, index) => {
        let requires = plugins[elem].meta.requires;
        if (requires && requires.length) {
            for (let req of requires) {
                if (neworder.indexOf(req) == -1) {
                    neworder.splice(0, 0, req);
                }
            }
        }
        if (neworder.indexOf(elem) == -1) {
            neworder.push(elem);
        }
    });

    return neworder;
}