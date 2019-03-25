"use strict";
const plugin = {
    name: 'plugin-name',
    tickrate: 10,
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
    pre: function () {
        return new Promise(async (resolve) => {
        });
    },
    pageControl: {
        pauseTicks: true,
        server: function (browser, input, output, storage) {
            input(data => {
                if (data == 'init') {
                }
            });
        },
        client: function (window, input, output) {
            input(data => {
            });
            output('init');
        }
    },
    run: function (hack, storage) {
        return new Promise(async (resolve) => {
        });
    }
};
module.exports = plugin;
