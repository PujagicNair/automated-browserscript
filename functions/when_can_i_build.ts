import { Webpage } from "./interfaces";

export default function whenCanIBuild(tab: Webpage) {
    return tab.evaluate(function() {
        var rows = {};
        var hr = document.querySelectorAll('[id^=main_buildrow]');
        for (var i = 0; i < hr.length; i++) {
            if (hr[i].querySelector('.inactive:not([colspan])')) {
                var prop = hr[i].id.match(/main_buildrow_(\w+)/)[1];
                var time;
                var str = hr[i].querySelector('.inactive:not([colspan])').innerHTML;
                if (str.indexOf('Genug Rohstoffe in') != -1) {
                    var off: any = str.match(/timer_replace">(.+?)</)[1].split(':');
                    time = Date.now() + off[0] * 60 * 60 * 1000 + off[1] * 60 * 1000 + off[2] * 1000;
                } else {
                    var match: any = str.match(/(heute|morgen)\sum\s(.+?):(.+?)/);
                    var now = new Date();
                    if (match[1] == 'morgen') {
                        now.setDate(now.getDate() + 1);
                    }
                    now.setHours(match[2]);
                    now.setMinutes(Number(match[3]) + 1);
                    now.setSeconds(0);
                    
                    time = now.getTime();
                }
                rows[prop] = time;
            }
        }
        return rows;
    });
}