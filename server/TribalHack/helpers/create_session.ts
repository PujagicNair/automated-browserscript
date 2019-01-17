import { TribalHack } from "..";

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default function createSession(hack: TribalHack): Promise<void> {
    return new Promise(async (resolve, reject) => {

        // open
        await hack.browser.open(hack.server.url);

        // login
        await hack.browser.type('#user', hack.config.username);
        await hack.browser.type('#password', hack.config.password);
        await hack.browser.click('a.btn-login');
        /*await hack.browser.exec(`function() {
            document.getElementById('user').value = "${hack.config.username}";
            document.getElementById('password').value = "${hack.config.password}";
            document.querySelector('a.btn-login').click();
        }`);*/

        await sleep(1000);

        let loginSuccess = (await hack.browser.selectMultiple('.worlds-container', '')).length != 0;
        /*let loginSuccess = await hack.browser.exec(`function() {
            return document.querySelectorAll('.worlds-container').length != 0;
        }`);*/

        if (!loginSuccess) {
            return reject('failed to log in');
        }

        // select word
        let worlds = await hack.browser.selectMultiple('a.world-select > span.world_button_active', 'innerText');
        let worldIndex = worlds.findIndex(world => world.slice(-hack.server.map.length) == hack.server.map);

        if (worldIndex == -1) {
            return reject('couldnt find world');
        }

        await hack.browser.click(`.worlds-container:first-of-type a.world-select:nth-of-type(${worldIndex + 1}) > span.world_button_active`);
        /*let hasWorld = await hack.browser.exec(`function() {
            var worlds = document.querySelectorAll('a.world-select > span.world_button_active');
            for (var i = 0; i < worlds.length; i++) {
                if (worlds[i].innerText.slice(-${hack.server.map.length}) == '${hack.server.map}') {
                    worlds[i].click();
                    return true;
                }
            }
            return false;
        }`);

        if (!hasWorld) {
            return reject('you havent started on the provided world');
        }*/

        await sleep(1000);

        if (hack.browser.url.indexOf('/game.php') == -1) {
            return reject('failed to select map');
        }

        let villageId = await hack.browser.cookie('global_village_id');

        if (!villageId || !villageId.value) {
            return reject('village cookie not found');
        }

        hack.villageId = villageId.value;
        return resolve();
    });
}