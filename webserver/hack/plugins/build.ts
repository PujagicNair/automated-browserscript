import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    type: "util",
    tickrate: 1,
    name: 'build',
    description: 'Used for other Plugins to automated build things (doesnt support premium with more than 2 in build queue)',
    requires: ['building-queue'],
    pluginSetup: {
        hasPage: false,
        hasWidget: false,
        hasTicks: true
    },
    run: function(hack, _, requires) {
        return new Promise(async resolve => {
            return resolve({
                success: true,
                build: function(building: string, force?: boolean) {
                    return new Promise(async resolve => {
                        let queueRes = requires['building-queue'];
                        if (hack.screen == "main" || force) {
                            if (force) {
                                await hack.gotoScreen("main");
                                queueRes = await queueRes.get();
                            }
                            if (!queueRes.success || queueRes.queue.length >= 2) {
                                return resolve({ success: false, message: 'queue is full or failed to load queue', error: 'queue' });
                            }
                            let hasButton = await hack.browser.selectMultiple(`[id^=main_buildlink_${building}]:not([id$=cheap]):not([style="display:none"])`, 'id');
                            
                            if (hasButton.length == 1) {
                                await hack.browser.page.evaluate((button) => {
                                    document.getElementById(button).click();
                                }, hasButton[0]);
                                return resolve({ success: true });
                            } else {
                                let inactive: string = await hack.browser.select(`#main_buildrow_${building} .build_options .inactive`, 'innerText');
                                if (inactive && inactive.match(/[0-9]{2,2}:[0-9]{2,2}$/)) {
                                    return resolve({ success: false, message: inactive, error: 'res' });
                                } else {
                                    return resolve({ success: false, message: inactive, error: 'farm' });
                                }
                            }
                        } else {
                            return resolve({ success: false, message: 'open main building', error: 'screen' });
                        }
                    });
                }
            });
        });
    }
}

export = plugin;