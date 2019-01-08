export default class AbsDate {

    private _time: string;

    constructor();
    constructor(time: number);
    constructor(date: Date);
    constructor(date: string);
    constructor(d?: number | Date | string) {
        let date: Date;
        if (!d) {
            date = new Date();
        } else if (typeof d == "number") {
            date = new Date(d);
        } else if (d instanceof Date) {
            date = d;
        } else if (typeof d == "string") {
            date = new Date(d);
        }
        this._time = new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toUTCString();
    }

    static now(): AbsDate {
        return new AbsDate();
    }

    toLocaleDate(): Date {
        return new Date(this._time);
    }

    toString(): string {
        return new Date(this._time).toString();
    }

    time(): number {
        return new Date(this._time).getTime();
    }


    private _add(ms: number): AbsDate {
        this._time = new Date(new Date(this._time).getTime() + ms).toISOString();
        return this;
    }
    add(ms: number | string): AbsDate;
    add(...ms: (number | string)[]): AbsDate;
    add(ms: (number | string)[]): AbsDate
    add(...args): AbsDate {
        let mss: number[] = args.reduce((acc, arg) => {
            if (Array.isArray(arg)) {
                acc.push(...arg.map(a => Number(a)));
            } else {
                acc.push(Number(arg));
            }
            return acc;
        }, []);
        let total = mss.reduce((acc, ms) => acc + ms);
        return this._add(total);
    }
}