"use strict";
module.exports = function (hack, storage, requires) {
    return new Promise(async (resolve) => {
        let nextTime = await storage.get('next', 0);
        let queue = await storage.get('queue', []);
        let build = requires['build'].build;
        if (queue.length && (Date.now() > nextTime)) {
            let next = queue[0];
            await hack.gotoScreen(next.screen);
            if (next.screen = "main") {
                let built = await build(next.unit);
                if (!built.success) {
                    if (built.error == "queue") {
                        let bq = requires['building-queue'];
                        if (bq.success && bq.queue.length != 0) {
                            let firstDone = bq.queue[0];
                            let times = firstDone.duration.match(/^([0-9]{1,2}):([0-9]{2,2}):([0-9]{2,2})$/);
                            if (times) {
                                let nextTime = (Number(times[1]) * 3600000) + (Number(times[2]) * 60000) + 60000;
                                storage.set('next', Date.now() + nextTime);
                            }
                        }
                    }
                    else if (built.error == "res") {
                        let times = built.message.match(/(([0-9]):)?([0-9]{1,2}):([0-9]{2,2})$/);
                        if (times && times[2]) {
                            let nextTime = (Number(times[4]) * 1000) + 5000;
                            storage.set('next', Date.now() + nextTime);
                        }
                        else if (times) {
                            let time = new Date();
                            time.setHours(Number(times[3]));
                            time.setMinutes(Number(times[4]) + 1);
                            if (time.getTime() < Date.now()) {
                                await storage.set('next', time.getTime() + 86400000);
                            }
                            else {
                                await storage.set('next', time.getTime());
                            }
                        }
                    }
                    else if (built.error == "farm") {
                        await storage.set('next', Date.now() + 300000);
                    }
                }
                else {
                    queue = queue.slice(1);
                }
            }
        }
        await storage.set('queue', queue);
        let next = await storage.get('next', 0);
        let maxDiff = await storage.get('max-diff', 0);
        if (maxDiff && next > (Date.now() + maxDiff)) {
            await storage.set('next', Date.now() + maxDiff);
            next = Date.now() + maxDiff;
            await hack.browser.reload();
        }
        let buildings = await storage.get('buildings', []);
        let wdStr;
        if (queue.length !== 0) {
            wdStr = `<div>next check: <b>${next ? new Date(next).toLocaleString() : 'immediately'}</b></div><br><table><tr><th>Bild</th><th>Name</th></tr>`;
            for (let entry of queue) {
                let building = buildings.find(building => building.key == entry.unit) || {};
                wdStr += `<tr><td style="border-top: 1px solid black"><img src="${building.img}"></td><td style="border-top: 1px solid black">${building.name}</td></tr>`;
            }
            wdStr += '</table>';
        }
        else {
            wdStr = 'nothing in queue';
        }
        return resolve({ queue, wdStr });
    });
};
