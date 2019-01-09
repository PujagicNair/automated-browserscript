import { TribalHack } from "../index";

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default function createSession(hack: TribalHack): Promise<void> {
    return new Promise(async resolve => {

        hack.output('var', 'started', true);

        if (!hack.browser.isStarted) {
            await hack.browser.start();
        }

        // open
        await hack.browser.open(hack.server.url);
        hack.output('action', 'openend url');

        // login
        await hack.browser.exec(`function() {
            document.getElementById('user').value = "${hack.credentials.username}";
            document.getElementById('password').value = "${hack.credentials.password}";
            document.querySelector('a.btn-login').click();
        }`);
        await sleep(1000);
        hack.output('action', 'logged in');

        // select word
        await hack.browser.exec(`function() {
            document.querySelector('a.world-select > span.world_button_active').click();
        }`);
        await sleep(1000);
        hack.output('action', 'selected world');

        let villageId = await hack.browser.cookie('global_village_id');

        hack.output('var', 'villageId', villageId.value);
        hack.output('var', 'booted', true);

        return resolve();
    });
}

export interface Credentials {
    username: string;
    password: string;
}