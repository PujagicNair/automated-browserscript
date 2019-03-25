import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    type: "extension",
    name: 'account-manager-buildings',
    description: 'description of the plugin',
    extends: 'account-manager',
    pluginSetup: {
        hasPage: false,
        hasTicks: false,
        hasWidget: false
    },
    requires: ['build', 'building-queue'],
    /*pre: async function(hack, storage, requires) {
        await hack.gotoScreen("main");
        let builds;
        await requires['buildings'].run(hack, {
            get: (_key, def) => def,
            set: (_key, val) => builds = val
        });
        await storage.set('buildings', builds.data);
    },*/
    run: async (hack, _storage, requires, util) => () => ({
        tickHandle: { screen: 'main' },
        async tick({ unit }) {
            try {
                let build = requires['build'].build;
                let built = await build(unit, true);
                if (!built.success) {
                    if (built.error == "queue") {
                        let bq = await requires['building-queue'].get();
                        return { success: false, next: util.time.fromString(bq.queue[0].duration) };
                    } else if (built.error == "res") {
                        let lookup = built.message.match(/(([0-9]):)?([0-9]{1,2}):([0-9]{2,2})$/);
                        if (lookup) {
                            let fullDay = util.time.hours(24);
                            let timeFromZero = util.time.fromString(lookup[0] + ':59');
                            let timeNow = Date.now() % fullDay;
                            let timeDiff = timeFromZero - timeNow;
                            if (timeDiff < 0) {
                                timeDiff += fullDay;
                            }
                            return { success: false, next: timeDiff };
                        }
                    // farm is full
                    } else if (built.error == "farm") {
                        // get building queue
                        let bq = await requires['building-queue'].get();
                        // is farm already building ?
                        if (!bq.queue.find(entry => entry.key == "farm")) {
                            // no = start building it
                            let self = await this.tick({ unit: "farm" });
                            if (self.success) {
                                bq = await requires['building-queue'].get();
                                // wait for it to be built
                                return { success: false, next: util.time.fromString(bq.queue[0].duration) };
                            } else {
                                // wait for farm to be ready to build
                                return self;
                            }
                        } else {
                            // wait for farm to be built
                            return { success: false, next: util.time.fromString(bq.queue[0].duration) };
                        }
                    }
                } else {
                    return { success: true };
                }  
            } catch (error) {
                return { success: false, next: 5000 };
            }
        },
        async page(): Promise<string> {
            return '';
        }
    })
}


export = plugin;