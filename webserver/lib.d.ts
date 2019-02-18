import { Server } from "socket.io";
import { Connection } from "mongoose";

declare global {
  namespace NodeJS {
    interface Global {
      io: Server;
      connection: Connection;
      sockets: { [userID: string]: string };
    }
  }
}

export { };