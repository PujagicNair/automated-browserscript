import Logger from "./Handlers/logger";
import { Server } from 'socket.io';
import { Connection } from "mongoose";

export function setLogger(_logger: Logger)  {
    logger = _logger;
}
export function setIO(_io: Server)  {
    io = _io;
}
export function setConnection(_conn: Connection) {
    conn = _conn;
}

export let logger: Logger;
export let io: Server;
export let conn: Connection;
export let sessions: Sessions = {};

interface Sessions {
    [user: string]: string;
}