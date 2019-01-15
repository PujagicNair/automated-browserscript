import { IPlugin } from "../../interfaces";

const plugin: IPlugin = {
    name: 'recource-sync',
    description: 'See your recources realtime in the browser',
    config: [],
    requires: [],
    pluginSetup: {
        hasPage: false,
        hasWidget: true
    },
    widget: `
        <table>
            <tr>
                <td>wood</td>
                <td>@wood</td>
            </tr>
            <tr>
                <td>stone</td>
                <td>@stone</td>
            </tr>
            <tr>
                <td>iron</td>
                <td>@iron</td>
            </tr>
        </table>
    `,
    run(hack) {
        return new Promise(async resolve => {
            let data = await hack.browser.selectMultiple('#wood, #stone, #iron', ['id', 'innerText']);
            let res = data.reduce((acc, self) => {
                acc[self.id] = self.innerText;
                return acc;
            }, {});
            return resolve(res);
        });
    }
}

export = plugin;