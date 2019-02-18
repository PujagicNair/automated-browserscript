import { IUtil } from "../interfaces";

const util: IUtil = {
    distance(c1: any, c2: any) {
        let c1p = this.parseCoords(c1);
        let c2p = this.parseCoords(c2);
        let x1 = c1p.x, y1 = c1p.y, x2 = c2p.x, y2 = c2p.y;
        let dx = Math.abs(x1 - x2), dy = Math.abs(y1 - y2);
        return Math.sqrt((dx * dx) + (dy * dy));
    },
    parseCoords(coords) {
        if (typeof coords == "object" && 'x' in coords && 'y' in coords) {
            return { x: Number(coords.x), y: Number(coords.y) };
        } else if (typeof coords == "string" && coords.match(/\d+\|\d+/)) {
            let split = coords.split('|');
            return { x: Number(split[0]), y: Number(split[1]) };
        } else {
            throw new Error('invalide coord format');
        }
    },
    travelSpeed(troops, dist) {
        let speed = this.troopSpeed(troops);
        return speed * dist;
    },
    troopSpeed(troops) {
        let slowest = Object.keys(troops).reduce((acc, key) => this.troops[key] > this.troops[acc] ? key : acc);
        return this.troops[slowest];
    },
    troops: {
        spear: 10000
    },
    random<T = any>(a1: T[] | number, a2?: number) {
        if (Array.isArray(a1)) {
            return a1[Math.floor(Math.random() * a1.length)];
        } else if (typeof a1 == "number") {
            let min = a2 ? a1 : 0;
            let max = a2 ? a2 : a1;
            return Math.floor(Math.random() * (max - min + 1) + min);
        } else {
            throw new Error('invalide arguments for random');
        }
    },
    time: {
        seconds(amt) {
            return Number(amt) * 1000;
        },
        minutes(amt) {
            return this.seconds(Number(amt) * 60);
        },
        hours(amt) {
            return this.minutes(Number(amt) * 60);
        },
        fromString(str) {
            if (str.match(/^\d{1,2}:\d{2,2}:\d{2,2}$/)) {
                let splits = str.split(':');
                return this.hours(splits[0]) + this.minutes(splits[1]) + this.seconds(splits[2]);
            } else {
                throw new Error('invalide time string format');
            }
        },
        toLocaleString(num) {
            let hours = num / this.hours(1);
            num -= num - (num % this.hours(1));
            let minutes = num / this.minutes(1);
            num -= num - (num % this.minutes(1));
            let seconds = num / this.seconds(1);

            let hstr = Math.floor(hours);
            let mstr = Math.floor(minutes);
            let sstr = Math.floor(seconds);
            return `${hstr ? ' ' + hstr + 'h' : ''}${mstr ? ' ' + mstr + 'm' : ''}${sstr ? ' ' + sstr + 's' : ''}`.trim();
        },
        toFormatString(num) {
            let hours = num / this.hours(1);
            num -= num - (num % this.hours(1));
            let minutes = num / this.minutes(1);
            num -= num - (num % this.minutes(1));
            let seconds = num / this.seconds(1);

            let hstr = hours.toFixed(0);
            let mstr = minutes.toFixed(0);
            let sstr = seconds.toFixed(0);
            return `${hstr}:${mstr.length == 1 ? '0' + mstr : mstr}:${sstr.length == 1 ? '0' + sstr : sstr}`;
        }
    }
};

export = util;