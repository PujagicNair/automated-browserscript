import { IPlugin } from "../interfaces";

interface MyWindow extends Window {
    [key: string]: any;
}

const plugin: IPlugin = {
    name: 'action-queue',
    description: 'give the script a list of things it has todo',
    requires: ['buildings', 'build', 'building-queue'],
    pre: async function(hack, storage, requires) {
        await hack.gotoScreen("main");
        let builds;
        await requires['buildings'].run(hack, {
            get: (_key, def) => def,
            set: (_key, val) => builds = val 
        });
        await storage.set('buildings', builds.data);
    },
    pluginSetup: {
        hasPage: true,
        hasWidget: true,
        hasTicks: true
    },
    page: `
        <link href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous">

        <style>

        </style>

        <div class="content">
            <h2>Action Queue</h2>

            <span class="title">Warteschlange</span>
            <span class="next">Nächste aktion: <span id="next">???</span></span>
            <table>
                <thead>
                    <tr>
                        <th>Ort</th>
                        <th>Was</th>
                        <th>Wie viel ?</th>
                    </tr>
                </thead>
                <tbody id="queue"></tbody>
            </table>

            <div class="title">Gebäude</div>
            <table>
                <thead>
                    <tr>
                        <th>Bild</th>
                        <th>Name</th>
                        <th>Stufe</th>
                        <th>Verbessern</th>
                    </tr>
                </thead>
                <tbody id="buildings"></tbody>
            </table>
        </div>
    `,
    pageControl: {
        pauseTicks: false,
        server: function(_browser, input, output, storage) {
            input(async data => {
                if (data == 'init') {
                    let buildings = await storage.get('buildings', []);
                    let queue = await storage.get('queue', []);
                    output({ type: 'init', buildings, queue });
                } else if (data.type == 'add') {
                    // add data
                    let queue = await storage.get('queue', []);
                    queue.push({ unit: data.unit, screen: data.screen });
                    await storage.set('queue', queue);
                } else if (data.type == 'force') {
                    // force check
                }
            });
        },
        client: function(window: MyWindow, input, output) {
            input(data => {
                let qs = sel => window.document.querySelector(sel);
                let qsa = sel => window.document.querySelectorAll(sel);
                if (data.type == 'init') {
                    let blstr = "";
                    for (let build of data.buildings) {
                        blstr += `<tr><td><img src="${build.img}"></td><td>${build.name}</td><td>${build.level}</td>
                        <td><button class="addbtn" data-unit="${build.key}">Add</button></td>
                        </tr>`;
                    }
                    qs("#buildings").innerHTML = blstr;
                    qsa("#buildings button").forEach(button => {
                        button.addEventListener('click', () => {
                            output({ type: 'add', unit: button.getAttribute('data-unit'), screen: 'main' });
                        });
                    });

                    let queueString = "";
                    console.log(data);
                    
                    for (let entry of data.queue) {
                        queueString += `
                            <tr>
                                <td>${entry.screen}</td>
                                <td>${entry.unit}</td>
                                <td>${entry.amount || '-'}</td>
                            </tr>
                        `;
                    }
                    qs("#queue").innerHTML = queueString;
                }
            });
            return output('init');
        }
    },
    widget: '<table>@queueString</table>',
    run: function(hack, storage, requires) {
        return new Promise(async resolve => {
            /*let nextTime = await storage.get('next', 0);
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
            }).join('');*/
            
            return resolve({ queue: [], queueString: '' });
        });
    }
}

export = plugin;