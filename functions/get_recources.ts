import { Webpage } from "./interfaces";

export default function getRecources(tab: Webpage) {
    return tab.evaluate<{ wood: number, stone: number, iron: number }>(function() {
        return {
            "wood": Number(document.getElementById('wood').innerText),
            "stone": Number(document.getElementById('stone').innerText),
            "iron": Number(document.getElementById('iron').innerText)
        }
    });
}