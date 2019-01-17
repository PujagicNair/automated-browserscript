import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    name: 'live-content',
    description: 'See the browsers content live',
    config: [],
    requires: [],
    pluginSetup: {
        hasPage: true,
        hasWidget: false,
        hasTicks: false
    },
    page: 'loading...',
    pageControl: {
        pauseTicks: true,
        server: function(hack, input, output) {
            let interval;
            input(async data => {
                if (data.type == "ready") {
                    clearInterval(interval);
                    interval = setInterval(async () => {
                        let res = await hack.browser.selectMultiple('#wood, #stone, #iron', ['id', 'innerText']);
                        res.forEach(entry => {
                            return output({ type: "selector", selector: "#" + entry.id, prop: 'innerText', value: entry.innerText });
                        });
                    }, 3000);
                } else if (data.type == "click") {
                    await hack.browser.page.evaluate((sel) => {
                        document.querySelector(sel).click();
                    }, data.selector);
                    setTimeout(() => {
                        sendPage();
                    }, 500);
                } else if (data.type == "input") {
                    await hack.browser.page.evaluate(({ selector, value }) => {
                        document.querySelector(selector).value = value;
                    }, data); 
                }
            });
            async function sendPage() {
                let content: string = await hack.browser.page.evaluate(() => document.all[0].innerHTML);
                content = content.replace(/<script[\s\S]+?<\/script>/, '');
                output({ type: "html", content });
            }

            sendPage();
            return () => {
                clearInterval(interval);
            };
        },
        client: function(window, input, output) {
            let uniqueSelector=e=>{let l;for(;e;){let t=e.localName;if(!t)break;if(e.id)return"#"+e.id+(l?">"+l:"");t=t.toLowerCase();const n=e.parentElement;if(n){const l=n.children;if(l.length>1){let n=0;const a=[...l].findIndex(l=>(e.localName===l.localName&&n++,l===e))+1;a>1&&n>1&&(t+=":nth-child("+a+")")}}l=t+(l?">"+l:""),e=n}return l};
            let canClick = true;
            let click = (callback) => {
                if (canClick) {
                    canClick = false;
                    callback();
                    setTimeout(() => {
                        canClick = true;
                    }, 50);
                }
            }
            input(data => {
                if (data.type == "html") {
                    window.document.all[0].innerHTML = data.content;
                    window.document.querySelectorAll("*").forEach((element: HTMLElement) => {
                        element.onclick = undefined;
                        element.addEventListener("click", function(event) {
                            event.preventDefault();
                            if ((element.tagName == "INPUT" && (<HTMLInputElement>element).type == "text") || element.tagName == "TEXTAREA") {
                                click(() => {});
                                return false;
                            }
                            click(() => output({ type: "click", selector: uniqueSelector(element) }));
                            return false;
                        });
                    });
                    window.document.querySelectorAll('input[type=text], textarea').forEach((input: HTMLInputElement) => {
                        input.addEventListener('change', function() {
                            output({ type: "input", selector: uniqueSelector(input), value: input.value });
                        });
                        
                    });
                    output({ type: 'ready' });
                } else if (data.type == "selector") {
                    window.document.querySelector(data.selector)[data.prop] = data.value;
                }
            });
        }
    }
}

export = plugin;