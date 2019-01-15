import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    name: 'action-queue',
    description: 'give the script a list of things it has todo',
    config: [],
    requires: ['screen'],
    pluginSetup: {
        hasPage: true,
        hasWidget: true,
        hasTicks: true
    },
    page: '<h4>Main Building</h4><table><tr><td>main</td><td><button data-screen="main" data-unit="main">add</button></td></tr><tr><td>barracks</td><td><button data-screen="main" data-unit="barracks">add</button></td></tr><tr><td>smith</td><td><button data-screen="main" data-unit="smith">add</button></td></tr><tr><td>market</td><td><button data-screen="main" data-unit="market">add</button></td></tr><tr><td>wood</td><td><button data-screen="main" data-unit="wood">add</button></td></tr><tr><td>stone</td><td><button data-screen="main" data-unit="stone">add</button></td></tr><tr><td>iron</td><td><button data-screen="main" data-unit="iron">add</button></td></tr><tr><td>farm</td><td><button data-screen="main" data-unit="farm">add</button></td></tr><tr><td>storage</td><td><button data-screen="main" data-unit="storage">add</button></td></tr><tr><td>hide</td><td><button data-screen="main" data-unit="hide">add</button></td></tr><tr><td>wall</td><td><button data-screen="main" data-unit="wall">add</button></td></tr></table><h4>Barracks</h4><table><tr><td>spear</td><td><input type="number" data-attach="spear" data-name="amount" data-prop="value"></td><td><button data-screen="barracks" data-unit="spear">add</button></td></tr><tr><td>sword</td><td><input type="number" data-attach="sword" data-name="amount" data-prop="value"></td><td><button data-screen="barracks" data-unit="sword">add</button></td></tr><tr><td>axe</td><td><input type="number" data-attach="axe" data-name="amount" data-prop="value"></td><td><button data-screen="barracks" data-unit="axe">add</button></td></tr></table>',
    pageControl: {
        pauseTicks: false,
        server: function(hack, input, output, storage) {
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
    widget: '',
    run: function(hack, storage, requires) {
        return new Promise(async resolve => {
            let nextTime = await storage.get('next', 0);
            let force = await storage.get('force', false);
            let queue = await storage.get('queue', []);
            if (queue.length && (Date.now() > nextTime || force)) {
                if (force) {
                    await storage.set('force', false);
                }
                let next = queue[0];
                await hack.gotoScreen(next.screen);
            } else {
                return resolve(queue);
            }
            return resolve(queue);
        });
    }
}

export = plugin;