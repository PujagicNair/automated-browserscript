import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    
    name: 'action-queue',
    description: 'give the script a list of things it has todo',
    requires: ['build', 'building-queue'],
    pluginSetup: {
        hasPage: true,
        hasWidget: true,
        hasTicks: true
    },
    page: '<h4>Main Building</h4><table><tr><td>main</td><td><button data-screen="main" data-unit="main">add</button></td></tr><tr><td>barracks</td><td><button data-screen="main" data-unit="barracks">add</button></td></tr><tr><td>smith</td><td><button data-screen="main" data-unit="smith">add</button></td></tr><tr><td>market</td><td><button data-screen="main" data-unit="market">add</button></td></tr><tr><td>wood</td><td><button data-screen="main" data-unit="wood">add</button></td></tr><tr><td>stone</td><td><button data-screen="main" data-unit="stone">add</button></td></tr><tr><td>iron</td><td><button data-screen="main" data-unit="iron">add</button></td></tr><tr><td>farm</td><td><button data-screen="main" data-unit="farm">add</button></td></tr><tr><td>storage</td><td><button data-screen="main" data-unit="storage">add</button></td></tr><tr><td>hide</td><td><button data-screen="main" data-unit="hide">add</button></td></tr><tr><td>wall</td><td><button data-screen="main" data-unit="wall">add</button></td></tr></table><h4>Barracks</h4><table><tr><td>spear</td><td><input type="number" data-attach="spear" data-name="amount" data-prop="value"></td><td><button data-screen="barracks" data-unit="spear">add</button></td></tr><tr><td>sword</td><td><input type="number" data-attach="sword" data-name="amount" data-prop="value"></td><td><button data-screen="barracks" data-unit="sword">add</button></td></tr><tr><td>axe</td><td><input type="number" data-attach="axe" data-name="amount" data-prop="value"></td><td><button data-screen="barracks" data-unit="axe">add</button></td></tr></table>',
    pageControl: {
        pauseTicks: false,
        server: function(_hack, input, _output, storage) {
            input(async data => {
                if (data.type == 'add') {
                    let queue = await storage.get('queue', []);
                    delete data.type;
                    queue.push(data);
                    await storage.set('queue', queue);
                } else if (data.type == 'force') {
                    await storage.set('force', true);
                }
            });
        },
        client: function(window, input, output) {
            window.document.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', function() {
                    let unit = button.getAttribute('data-unit');
                    let send = { type: 'add', screen: button.getAttribute('data-screen'), unit }
                    window.document.querySelectorAll(`[data-attach=${unit}]`).forEach(attachement => {
                        send[attachement.getAttribute('data-name')] = attachement[attachement.getAttribute('data-prop')];
                    });
                    output(send);
                });
            });
        }
    },
    widget: '<table>@queueString</table>',
    run: function(hack, storage, requires) {
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
                                    next.time = new Date(Date.now() + nextTime).toString();
                                }
                            }
                        } else if (built.error == "res") {
                            let times = built.message.match(/(([0-9]):)?([0-9]{1,2}):([0-9]{2,2})$/);
                            if (times && times[2]) {
                                let nextTime = (Number(times[4]) * 1000) + 5000;
                                storage.set('next', Date.now() + nextTime);
                                next.time = new Date(Date.now() + nextTime).toString();
                            } else if (times) {
                                let time = new Date();
                                time.setHours(Number(times[3]));
                                time.setMinutes(Number(times[4]) + 1);
                                if (time.getTime() < Date.now()) {
                                    await storage.set('next', time.getTime() + 86400000);
                                    next.time = new Date(time.getTime() + 86400000).toString();
                                } else {
                                    await storage.set('next', time.getTime());
                                    next.time = new Date(time.getTime()).toString();
                                }
                            }
                        } else if (built.error == "farm") {
                            await storage.set('next', Date.now() + 300000);
                        }
                        queue[0].time = next.time;
                    } else {
                        queue = queue.slice(1);
                    }
                }
            }
            await storage.set('queue', queue);
            let queueString = queue.length == 0 ? 'nothing in queue' : queue.map(entry => {
                let str = '<tr>';
                Object.keys(entry).forEach(key => {
                    str += `<td style="border: 1px solid black; padding: 5px;">${key}: ${entry[key]}</td>`;
                });
                str += '</tr>';
                return str;
            }).join('');
            return resolve({ queue, queueString });
        });
    }
}

export = plugin;