export default class Logger {

    private pipes: Function[];
    constructor(...pipes: Function[]) {
        this.pipes = pipes;
    }

    log(...args) {
        this.pipes.forEach(pipe => pipe(...args));
    }

}