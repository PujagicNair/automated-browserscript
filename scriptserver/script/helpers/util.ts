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
    troops: [
        { key: "spear", img: 'https://dsde.innogamescdn.com/asset/a5b5e15d/graphic/unit/unit_spear.png', costs: { wood: 50, stone: 30, iron: 10 }, space: 1, speed: 18 },
        { key: "sword", img: 'https://dsde.innogamescdn.com/asset/a5b5e15d/graphic/unit/unit_sword.png', costs: { wood: 30, stone: 30, iron: 70 }, space: 1, speed: 22 },
        { key: "axe", img: 'https://dsde.innogamescdn.com/asset/a5b5e15d/graphic/unit/unit_axe.png', costs: { wood: 60, stone: 30, iron: 40 }, space: 1, speed: 18 },
        { key: "spy", img: 'https://dsde.innogamescdn.com/asset/a5b5e15d/graphic/unit/unit_spy.png', costs: { wood: 50, stone: 50, iron: 20 }, space: 2, speed: 9 },
        { key: "light", img: 'https://dsde.innogamescdn.com/asset/a5b5e15d/graphic/unit/unit_light.png', costs: { wood: 125, stone: 100, iron: 250 }, space: 4, speed: 10 },
        { key: "heavy", img: 'https://dsde.innogamescdn.com/asset/a5b5e15d/graphic/unit/unit_heavy.png', costs: { wood: 200, stone: 150, iron: 600 }, space: 6, speed: 11 },
        { key: "ram", img: 'https://dsde.innogamescdn.com/asset/a5b5e15d/graphic/unit/unit_ram.png', costs: { wood: 300, stone: 200, iron: 200 }, space: 5, speed: 30 },
        { key: "catapult", img: 'https://dsde.innogamescdn.com/asset/a5b5e15d/graphic/unit/unit_catapult.png', costs: { wood: 300, stone: 400, iron: 100 }, space: 8, speed: 30 }
    ],
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