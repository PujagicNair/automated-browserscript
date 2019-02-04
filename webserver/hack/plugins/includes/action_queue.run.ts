import { IRunFunction } from "../../interfaces";


export = <IRunFunction>function(hack, storage, requires) {
    return new Promise(async resolve => {
        let nextTime = await storage.get('next', 0);
        let force = await storage.get('force', false);
        let queue = await storage.get('queue', []);
        let build = requires['build'].build;

        if (queue.length && (Date.now() > nextTime || force)) {
            if (force) {
                await storage.set('force', false);
            }
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
                    } else if (built.error == "res") {
                        let times = built.message.match(/(([0-9]):)?([0-9]{1,2}):([0-9]{2,2})$/);
                        if (times && times[2]) {
                            let nextTime = (Number(times[4]) * 1000) + 5000;
                            storage.set('next', Date.now() + nextTime);
                        } else if (times) {
                            let time = new Date();
                            time.setHours(Number(times[3]));
                            time.setMinutes(Number(times[4]) + 1);
                            if (time.getTime() < Date.now()) {
                                await storage.set('next', time.getTime() + 86400000);
                            } else {
                                await storage.set('next', time.getTime());
                            }
                        }
                    } else if (built.error == "farm") {
                        await storage.set('next', Date.now() + 300000);
                    }
                } else {
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
        }

        let str = `<tr>
            <td>next</td>
            <td>${next ? new Date(next).toString() : 'immediately'}</td>
        </tr>`;
        let queueMap = queue.length == 0 ? 'nothing in queue' : queue.map(entry => {
            let str = '<tr>';
            Object.keys(entry).forEach(key => {
                str += `<td style="border: 1px solid black; padding: 5px;">${key}: ${entry[key]}</td>`;
            });
            str += '</tr>';
            return str;
        }).join('');
        
        return resolve({ queue, queueString: (queue.length ? (str + queueMap) : queueMap) });
    });
}