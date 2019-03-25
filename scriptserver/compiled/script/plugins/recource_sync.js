"use strict";
const plugin = {
    tickrate: 1,
    name: 'recource-sync',
    description: 'See your recources realtime in the browser',
    requires: [],
    pluginSetup: {
        hasPage: false,
        hasWidget: true,
        hasTicks: true
    },
    widget: `
        <table>
            <tr>
                <td style="border-right: 1px solid; padding: 0 8px 0 5px;"><i class="ds-icon" data-type="wood"></i>@wood</td>
                <td style="border-right: 1px solid; padding: 0 8px 0 5px;"><i class="ds-icon" data-type="stone"></i>@stone</td>
                <td style="border-right: 1px solid; padding: 0 8px 0 5px;"><i class="ds-icon" data-type="iron"></i>@iron</td>
                <td style="border-right: 1px solid; padding: 0 8px 0 5px;"><i class="ds-icon" data-type="storage"></i>@storage</td>
                <td style="padding: 0 8px 0 5px;"><i class="ds-icon" data-type="farm"></i>@pop_current_label/@pop_max_label</td>
            </tr>
        </table>
    `,
    run(hack) {
        return new Promise(async (resolve) => {
            let data = await hack.browser.selectMultiple('#wood, #stone, #iron, #storage, #pop_current_label, #pop_max_label', ['id', 'innerText']);
            let res = data.reduce((acc, self) => {
                acc[self.id] = self.innerText;
                return acc;
            }, {});
            return resolve(res);
        });
    }
};
module.exports = plugin;
