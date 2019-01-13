import { PluginRequireData } from "../interfaces";

export default function orderPlugins(plugins: PluginRequireData, used: string[]): string[] {

    let neworder = [];

    used.forEach((elem, index) => {
        let requires = plugins[elem].requires;
        if (requires && requires.length) {
            for (let req of requires) {
                if (neworder.indexOf(req) == -1) {
                    neworder.splice(0, 0, req);
                }
            }
        }
        if (neworder.indexOf(elem) == -1) {
            neworder.push(elem);
        }
    });

    return neworder;
}