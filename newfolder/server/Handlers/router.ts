import { Router as CreateRouter } from 'express'

export default class Router {

    static handler() {
        let router = CreateRouter();

        return router;
    }

}