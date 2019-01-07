import { Browser } from "../index";
const sleep = ms => new Promise(r => setTimeout(r, ms));

export default function createSession(browser: Browser, credentials: Credentials, output: (...args: any[]) => void): Promise<void> {
    return new Promise(async resolve => {

        output('var', 'started', true);

        if (!browser.isStarted) {
            await browser.start();
        }

        // open
        await browser.open('https://die-staemme.de/');
        output('action', 'openend url');

        // login
        await browser.exec(`function() {
            document.getElementById('user').value = "${credentials.username}";
            document.getElementById('password').value = "${credentials.password}";
            document.querySelector('a.btn-login').click();
        }`);
        await sleep(1000);
        output('action', 'logged in');

        // select word
        await browser.exec(`function() {
            document.querySelector('a.world-select > span.world_button_active').click();
        }`);
        await sleep(1000);
        output('action', 'selected world');

        let villageId = await browser.cookie('global_village_id');

        output('var', 'villageId', villageId.value);
        output('var', 'booted', true);

        return resolve();
    });
}

export interface Credentials {
    username: string;
    password: string;
}