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
      this.socket.on(action, (...data: any[]) => {
        this.listeners[action].next(data);
      });
      return this.listeners[action];
    }
  }

  
  default(): Subject<DefaultSub> {
    let subject = new Subject<DefaultSub>();
    this.on('script-default').subscribe(data => {
      subject.next({ scriptID: data[0], action: data[1], data: data[2] });
    });
    return subject;
  }

  widget(scriptID: string, name: string): Subject<WidgetSub> {
    let subject = new Subject<WidgetSub>();
    this.on('script-widget').subscribe(data => {
      if (data[0] == scriptID && data[1] == name) {
        subject.next(data[2]);
      }
    });
    return subject;
  }

  plugin(scriptID: string, name: string): Subject<WidgetSub> {
    let subject = new Subject<WidgetSub>();
    this.on('script-plugin').subscribe(data => {
      if (data[0] == scriptID && data[1] == name) {
        subject.next(data[2]);
      }
    });
    return subject;
  }

  pluginOutput(scriptID: string, name: string) {
    return data => this.socket.emit(`page-${scriptID}-${name}`, data);
  }

}

type DefaultSub = { scriptID: string, action: string, data: any };
type WidgetSub = any;

interface IListeners {
  [action: string]: Subject<any>;
}
