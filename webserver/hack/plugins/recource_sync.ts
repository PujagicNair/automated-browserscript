import { IPlugin } from "../interfaces";

const plugin: IPlugin = {
    
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
                <td>wood</td>
                <td>@wood</td>
                <td>@wood_str</td>
            </tr>
            <tr>
                <td>stone</td>
                <td>@stone</td>
                <td>@stone_str</td>
            </tr>
            <tr>
                <td>iron</td>
                <td>@iron</td>
                <td>@iron_str</td>
            </tr>
            <tr>
                <td>storage</td>
                <td>@storage</td>
            </tr>
        </table>
    `,
    run(hack) {
        return new Promise(async resolve => {
            let data = await hack.browser.selectMultiple('#wood, #stone, #iron, #storage', ['id', 'innerText', 'title']);
            let res = data.reduce((acc, self) => {
                acc[self.id] = self.innerText;
                acc[self.id + '_str'] = self.title;
                return acc;
            }, {});
            return resolve(res);
        });
    }
}

export = plugin;