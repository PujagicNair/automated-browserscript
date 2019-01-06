import { Webpage } from "./interfaces";

export default function buildQueue(tab: Webpage) {
    return tab.evaluate<string[]>(function() {
        var holders = document.querySelectorAll('#buildqueue tr img');
        var names = [];
        for (var i = 0; i < holders.length; i++) {
            names.push(holders[i].parentElement.innerText);
        }
        return names;
    });
}