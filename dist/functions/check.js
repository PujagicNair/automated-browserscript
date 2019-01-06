"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_recources_1 = __importDefault(require("./get_recources"));
const build_queue_1 = __importDefault(require("./build_queue"));
const queue_done_1 = __importDefault(require("./queue_done"));
const can_i_build_1 = __importDefault(require("./can_i_build"));
const when_can_i_build_1 = __importDefault(require("./when_can_i_build"));
const build_1 = __importDefault(require("./build"));
function check(tab, customQueue) {
    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
        let queue = yield build_queue_1.default(tab);
        if (queue.length == 2) {
            return resolve({
                reason: 'Building Queue is full',
                nextTime: yield queue_done_1.default(tab)
            });
        }
        else {
            let next;
            if (customQueue.length) {
                next = customQueue[0];
            }
            else {
                let res = yield get_recources_1.default(tab);
                next = Object.keys(res).reduce((acc, r) => res[r] < res[acc] ? r : acc);
            }
            if (yield can_i_build_1.default(tab, next)) {
                yield build_1.default(tab, next);
                return resolve({
                    reason: 'built ' + next + '!',
                    hasDoneCustom: next == customQueue[0],
                    nextTime: Date.now() + 5000
                });
            }
            else {
                let times = yield when_can_i_build_1.default(tab);
                if (customQueue[0]) {
                    return resolve({
                        reason: 'waiting for custom to be buildable: ' + next,
                        nextTime: times[next]
                    });
                }
                else {
                    let nextMine = Object.keys(times).filter(key => ['wood', 'stone', 'iron'].indexOf(key) != -1).reduce((acc, key) => times[key] < times[acc] ? key : acc);
                    return resolve({
                        reason: 'waiting for next mine: ' + nextMine,
                        nextTime: times[nextMine]
                    });
                }
            }
        }
    }));
}
exports.default = check;
