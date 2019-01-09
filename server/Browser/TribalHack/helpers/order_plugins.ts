import { HackPluginData } from "../IMeta";

function swap(list, x, y) {
    let b = list[y];
    list[y] = list[x];
    list[x] = b;
}


export default function orderPlugins(plugins: HackPluginData, used: string[]): string[] {

    let noreq = used.filter(name => !plugins[name].meta.requires || !plugins[name].meta.requires.length);
    let havereq = used.filter(name => plugins[name].meta.requires && plugins[name].meta.requires.length);

    let c = 1;

    for (let i in havereq) {
        let index = Number(i);
        let elem = havereq[i];
       // swap right
    }

    return noreq.concat(havereq);
}