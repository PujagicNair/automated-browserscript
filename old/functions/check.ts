import { Webpage } from "./interfaces";
import getRecources from "./get_recources";
import buildQueue from "./build_queue";
import queueDone from "./queue_done";
import canIBuild from "./can_i_build";
import whenCanIBuild from "./when_can_i_build";
import build from "./build";

export default function check(tab: Webpage, customQueue: string[]) {
    return new Promise<any>(async resolve => {
        let queue = await buildQueue(tab);
        if (queue.length == 2) {
            return resolve({
                reason: 'Building Queue is full',
                nextTime: await queueDone(tab)
            });
        } else {
            let next;
            if (customQueue.length) {
                next = customQueue[0];
            } else {
                let res = await getRecources(tab);
                next = Object.keys(res).reduce((acc, r) => res[r] < res[acc] ? r : acc);
            }

            if (await canIBuild(tab, next)) {
                await build(tab, next);
                return resolve({
                    reason: 'built ' + next + '!',
                    hasDoneCustom: next == customQueue[0],
                    nextTime: Date.now() + 5000
                });
            } else {
                let times = await whenCanIBuild(tab);
                if (customQueue[0]) {
                    return resolve({
                        reason: 'waiting for custom to be buildable: ' + next,
                        nextTime: times[next]
                    });
                } else {
                    let nextMine = Object.keys(times).filter(key => ['wood', 'stone', 'iron'].indexOf(key) != -1).reduce((acc, key) => times[key] < times[acc] ? key : acc);
                    return resolve({
                        reason: 'waiting for next mine: ' + nextMine,
                        nextTime: times[nextMine]
                    });
                }
            }
        }
    });
}