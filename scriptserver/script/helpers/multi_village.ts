import { Hack } from "../hack";
import { IVillage } from "../interfaces";


export default function multiVillages(hack: Hack) {
    return new Promise(async resolve => {
        await hack.gotoScreen("info_player");
        let rows = await hack.browser.selectMultiple('#villages_list [data-id]', ['innerText', 'innerHTML']);
        let villages: IVillage[] = rows.map(row => ({
            name: row.innerText,
            id: row.innerHTML.match(/id=(\d+)/)[1]
        }));

        if (villages.length) {
            for (let village of villages) {
                let page = await hack.browser.newPage(village.id);
                await page.goto(`https://${hack.config.serverCode}.${hack.config.serverUrl}/game.php?village=${village.id}&screen=overview`);
                let coordStr = await hack.browser.scoped(village.id).select('#menu_row2_village + td .nowrap', 'innerText');
                let coordMatch = coordStr.match(/\((\d+)\|(\d+)\)/);
                village.x = coordMatch[1];
                village.y = coordMatch[2];

                let pointStr = await hack.browser.scoped(village.id).select('#show_summary h4', 'innerText');
                let pointMatch = pointStr.match(/\((\d+)/)[1];
                village.points = Number(pointMatch);
            }
            await hack.browser.page.close();
        }
        hack.browser.defaultPage = villages[0].id;
        hack.villages = villages;
        return resolve();
    });
}