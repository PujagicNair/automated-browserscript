import { IPlugin } from "../interfaces";


const plugin: IPlugin = {
    name: 'plugin-name',
    description: 'description of the plugin',
    pluginSetup: {
        hasPage: true,
        hasTicks: true,
        hasWidget: false
    },
    requires: [],
    page: `
        <div>
            HTML Content of the Plugin Page
        </div>
    `,
    widget: `
        <div>
            HTML Content of the Widget
            @varname to render a tickoutput in
        </div>
    `,
    pre: function() {
        return new Promise(async resolve => {
            // preload plugin
        });
    },
    pageControl: {
        pauseTicks: true,
        server: function(browser, input, output, storage) {
            // handle server page here
            input(data => {
                if (data == 'init') {
                    // init serverside plugin page
                }
            });
        },
        client: function(window, input, output) {
            // handle client page here
            input(data => {

            });

            output('init');
        }
    },
    run: function(hack, storage) {
        return new Promise(async resolve => {
            // handle ticks here
            
        });
    }
}

export = plugin;