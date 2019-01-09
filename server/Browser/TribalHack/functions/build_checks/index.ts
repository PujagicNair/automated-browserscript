import { TribalHack } from "../../index";
import { IMeta } from "../../IMeta";

export function run(hack: TribalHack, pluginOptions: any) {

}

export const meta: IMeta = {
    name: 'build-checks',
    description: 'You can add infinite items to your building queue, you can add everything to your building queue even if you dont have enought recourses, it will just start building it when you have enought',
    config: [],
    addition: 'low ticktime prefered',
    requires: ['building-queue']
}