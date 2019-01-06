import { Webpage } from "./interfaces";

export default function queueDone(tab: Webpage) {
    return tab.evaluate<number>(function() {
        var wrap: any[] = (<any>document).querySelector('#buildqueue tr.nodrag:nth-child(2) span').innerText.split(':');
        var now = Date.now();
        return now + wrap[0] * 3600000 + wrap[1] * 60000 + 61000;
    });
}