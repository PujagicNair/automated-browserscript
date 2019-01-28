import { Hack } from "../hack";


export default function multiVillages(hack: Hack) {
    return new Promise(async resolve => {
        await hack.gotoScreen("info_player");
        let rows = await hack.browser.selectMultiple('#villages_list [data-id]', ['innerText', 'innerHTML']);
        let villages = rows.map(row => ({
            name: row.innerText,
            id: row.innerHTML.match(/id=(\d+)/)[1]
        }));

        if (villages.length > 1) {
            for (let village of villages) {
                let page = await hack.browser.newPage(village.id);
                await page.goto(`https://${hack.config.serverCode}.${hack.config.serverUrl}/game.php?village=${village.id}&screen=overview`);
            }
            await hack.browser.page.close();
        }
        hack.browser.defaultPage = villages[0].id;
        hack.villages = villages;
        return resolve();
    });
}