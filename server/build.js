"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const plugin = {
    name: 'build',
    description: 'Used for other Plugins to automated build things (doesnt support premium with more than 2 in build queue)',
    config: [],
    requires: ['building-queue'],
    pluginSetup: {
        hasPage: true,
        hasWidget: false,
        hasTicks: true
    },
    page: '',
    pageControl: {
        pauseTicks: true,
        client: function () {
        },
        server: function () {
        }
    },
    run: function (hack, _, requires) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            return resolve({
                build: function (building, force) {
                    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                        let queueRes = requires['building-queue'];
                        if (hack.screen == "main" || force) {
                            if (force) {
                                yield hack.gotoScreen("main");
                                queueRes = yield queueRes.get();
                            }
                            if (!queueRes.success || queueRes.queue.length >= 2) {
                                return resolve({ success: false, message: 'queue is full or failed to load queue', error: 'queue' });
                            }
                            let hasButton = yield hack.browser.selectMultiple(`[id^=main_buildlink_${building}]:not([id$=cheap]):not([style="display:none"])`, 'id');
                            if (hasButton.length == 1) {
                                yield hack.browser.page.evaluate((button) => {
                                    document.getElementById(button).click();
                                }, hasButton[0]);
                                return resolve({ success: true });
                            }
                            else {
                                let inactive = yield hack.browser.select(`#main_buildrow_${building} .build_options .inactive`, 'innerText');
                                if (inactive.match(/[0-9]{2,2}:[0-9]{2,2}$/)) {
                                    return resolve({ success: false, message: inactive, error: 'res' });
                                }
                                else {
                                    return resolve({ success: false, message: inactive, error: 'farm' });
                                }
                            }
                        }
                        else {
                            return resolve({ success: false, message: 'open main building', error: 'screen' });
                        }
                    }));
                }
            });
        }));
    }
};
module.exports = plugin;
