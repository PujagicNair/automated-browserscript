export default function sleep(ms: number) {
    return new Promise(resolve => {
        return setTimeout(() => {
            return resolve();
        }, ms);
    });
}