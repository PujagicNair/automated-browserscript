export default function sleep<T = any>(ms: number, value?: T): Promise<T> {
    return new Promise(resolve => {
        return setTimeout(() => {
            return resolve(value);
        }, ms);
    });
}