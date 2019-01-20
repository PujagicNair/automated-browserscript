import { IPlugin } from "../interfaces";
let sleep = ms => new Promise(r => setTimeout(r, ms));

const plugin: IPlugin = {
    name: 'live-screen',
    description: 'Gives you a livestream of your page where you can do some actions',
    config: [],
    requires: [],
    page: '<canvas id="cnv" width="1003" height="730"></canvas>',
    pluginSetup: {
        hasWidget: false,
        hasPage: true,
        hasTicks: false
    },
    pageControl: {
        pauseTicks: true,
        server: function(hack, input, output, storage) {
            input(async data => {
                if (data.type == "click") {
                    await hack.browser.click(data);
                    await sleep(500);
                    await sendScreen();
                }
            });

            async function sendScreen() {
                let screen = await hack.browser.screenshot({ encoding: 'base64', fullPage: false, type: 'jpeg' });
                output({ b64: screen, x: 0, y: 0, type: 'page' });
            }

            sendScreen();

            return () => {};
        },
        client: function(window: any, input, output) {
            let canvas: HTMLCanvasElement = window.document.getElementById('cnv');
            canvas.addEventListener('click', function(event) {
                let x = event.clientX;
                let y = event.clientY;
                output({ type: 'click', x, y });
            })
            input(data => {
                let img = new Image();
                img.onload = function() {
                    if (data.type == 'page') {
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }
                    let ctx = canvas.getContext('2d');
                    ctx.drawImage(img, data.x, data.y);
                }
                img.src = "data:image/jpeg;base64," + data.b64;
            });
        }
    }
}

export = plugin;