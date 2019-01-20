import { Hack } from "../hack";
import sleep from "./sleep";

export default function createSession(hack: Hack): Promise<void> {
    return new Promise(async (resolve, reject) => {
        // open
        await hack.browser.open(hack.config.serverUrl);

        // login
        await hack.browser.type('#user', hack.config.username);
        await hack.browser.type('#password', hack.config.password);
        await hack.browser.click('a.btn-login');
        await sleep(1000);

        // check login success
        let loginSuccess = (await hack.browser.selectMultiple('.worlds-container', '')).length != 0;
        if (!loginSuccess) {
            return reject('failed to log in');
        }

        // find world
        let worlds = await hack.browser.selectMultiple('a.world-select > span.world_button_active', 'innerText');
        let worldIndex = worlds.findIndex(world => world.slice(-hack.config.map.length) == hack.config.map);
        if (worldIndex == -1) {
            return reject('couldnt find world');
        }

        // select world
        await hack.browser.click(`.worlds-container:first-of-type a.world-select:nth-of-type(${worldIndex + 1}) > span.world_button_active`);
        await sleep(1000);
        if (hack.browser.url.indexOf('/game.php') == -1) {
            return reject('failed to select map');
        }

        // get village id
        let villageId = await hack.browser.cookie('global_village_id');
        if (!villageId || !villageId.value) {
            return reject('village cookie not found');
        }
        hack.villageId = villageId.value;

        // done
        return resolve();
    });
}