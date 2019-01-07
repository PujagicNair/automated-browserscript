import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private listeners: IListeners = {};
  private socket;
  constructor() {
    this.socket = io();
  }

  emit(action: string, ...data: any[]) {
    this.socket.emit(action, ...data);
  }

  on<T = any>(action: string): Subject<T> {
    if (this.listeners[action]) {
      return this.listeners[action];
    } else {
      this.listeners[action] = new Subject();
      this.socket.on(action, data => {
        this.listeners[action].next(data);
      });
      return this.listeners[action];
    }
  }
}

interface IListeners {
  [action: string]: Subject<any>;
}
