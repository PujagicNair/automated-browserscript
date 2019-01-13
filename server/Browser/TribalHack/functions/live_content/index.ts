import { IPlugin } from "../../interfaces";

const plugin: IPlugin = {
    name: 'live-content',
    description: 'You can view your village live inside your browser and interact with it',
    config: [],
    requires: [],
    page: 'loading...',
    pluginSetup: {
        hasWidget: false,
        hasPage: true
    },
    pageControl: {
        pauseTicks: true,
        server: function(hack, input, output, storage) {
            return new Promise(resolve => {
                input(async data => {
                    console.log(data);
                    
                    if (data.action == 'clicklink') {
                        let url = data.href.split(/(\/game\.php)/).slice(1).join("");
                        await hack.browser['tab'].on('onLoadFinished', (newurl) => {
                            hack.browser['tab'].off('onLoadFinished');
                            sendPage();
                        });
                        await hack.browser.click(`[href='${url}']`);
                    } else if (data.action == 'clickid') {
                        await hack.browser.click(`#${data.id}`);
                    } else if (data.action == 'setcheckbox') {
                        await hack.browser.exec(`document.getElementById('${data.id}').checked = ${data.checked};`);
                    } else if (data.action == 'setinput') {
                        await hack.browser.exec(`document.getElementById('${data.id}').value = ${data.value};`);
                    } else if (data.action == 'onclick') {
                        await hack.browser.exec(data.str);
                    } else if (data.action == 'reload') {
                        sendPage();
                    }
                });

                function getPageCode() {
                    return new Promise<string>(async resolve => {
                        let content = await hack.browser.exec('function() { return document.all[0].innerHTML }');
                        content = content.replace(/<script[.\s\S]+?\/script>/g, '');
                        let parts: string[] = content.split(/(<body.+?>)/);
                        parts.splice(2, 0, '<div style="position: fixed; top: 13px; left: 20px; padding: 5px; background-color: white; z-index: 12001;" data-plugin-controll="reload">reload</div>');
                        content = parts.join('');
                        return resolve(content);
                    });
                }

                async function sendPage() {
                    return output({ type: "html", content: await getPageCode() });;
                }

                sendPage();

                return resolve();
            });
        },
        client: function(window, input, output) {
            input(data => {
                if (data.type == "html") {
                    let canClick = true;
                    function click(callback) {
                        if (canClick) {
                            canClick = false;
                            setTimeout(() => {
                                canClick = true;
                            }, 50);
                            callback();
                        }
                    }
                    window.document.all[0].innerHTML = data.content;
                    window.document.querySelectorAll('[href]').forEach((element: HTMLLinkElement) => {
                        element.addEventListener('click', function(event) {
                            event.preventDefault();
                            click(() => output({ action: 'clicklink', href: element.href }));
                            return false;
                        });
                    });
                    window.document.querySelectorAll('input').forEach((element: HTMLInputElement) => {
                        element.addEventListener('change', function() {
                            if (element.type == "checkbox") {
                                output({ action: 'setcheckbox', checked: element.checked, id: element.id });
                            } else {
                                output({ action: 'setinput', value: element.value, id: element.id });
                            }
                        });
                    });
                    window.document.querySelectorAll('[onclick]').forEach((element: HTMLElement) => {
                        let str = element.onclick.toString();
                        element.onclick = () => false;
                        element.addEventListener('click', function() {
                            click(() => output({ action: 'onclick', str }));
                        });
                    });
                    window.document.querySelectorAll('[id]:not([href]):not(input):not([onclick])').forEach((element: HTMLElement) => {
                        element.addEventListener('click', function() {
                            click(() => output({ action: 'clickid', id: element.id }));
                        });
                    });
                    window.document.querySelectorAll('[data-plugin-controll]').forEach((element: HTMLElement) => {
                        element.addEventListener('click', function() {
                            click(() => output({ action: element.getAttribute('data-plugin-controll') }));
                        });
                    });
                }
            });
        }
    }
}

export = plugin;