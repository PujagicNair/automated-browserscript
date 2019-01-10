import { TribalHack } from "../../index";
import { IMeta } from "../../IMeta";

export function run(hack: TribalHack) {
    return new Promise(async resolve => {
        let data = await hack.browser.exec(function() {
            return {
                "wood": Number(document.getElementById('wood').innerText),
                "stone": Number(document.getElementById('stone').innerText),
                "iron": Number(document.getElementById('iron').innerText)
            }
        });
        return resolve(data);
    });
}

export const meta: IMeta = {
    name: 'recource-sync',
    description: 'See your recources realtime in the browser',
    config: []
}