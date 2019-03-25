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
    name: 'villages',
    description: 'returns all villages you have',
    pluginSetup: {
        hasPage: false,
        hasTicks: true,
        hasWidget: false
    },
    requires: [],
    pre: function (hack, storage) {
        return __awaiter(this, void 0, void 0, function* () {
            yield hack.gotoScreen('info_player');
            let rows = yield hack.browser.selectMultiple('#villages_list [data-id]', ['innerText', 'innerHTML']);
            let villages = rows.map(row => ({
                name: row.innerText,
                id: row.innerHTML.match(/village=(\d+)/)[1]
            }));
            yield storage.set('villages', villages);
            return;
        });
    },
    run: function (_hack, storage) {
        return storage.get('villages', []);
    }
};
module.exports = plugin;
