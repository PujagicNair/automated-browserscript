import Logger from "./Handlers/logger";
import { Server } from 'socket.io';

export function setLogger(_logger: Logger)  {
    logger = _logger;
}
export function setIO(_io: Server)  {
    io = _io;
}
export let logger: Logger;
export let io: Server;
export let sessions: Sessions = {};

interface Sessions {
    [user: string]: string;
}