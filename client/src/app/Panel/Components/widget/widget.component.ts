import { Component, OnInit, OnDestroy, Input, ElementRef, ViewChild } from '@angular/core';
import { SocketService } from '../../Services/socket.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent implements OnInit, OnDestroy {

  @Input() private scriptID: string;
  @Input() private plugin: string;
  @ViewChild('content') private content: ElementRef<HTMLDivElement>;

  constructor(private socket: SocketService, private http: HttpClient) { }

  updater;
  data;
  html: string;
  time: string;
  lastTime: number;
  interval;

  ngOnInit() {
    this.interval = setInterval(() => {
      this.time = this.timeOf();
    }, 1000);
    this.updater = this.socket.widget(this.scriptID, this.plugin).subscribe(data => {
      this.apply(data, Date.now());
    });

    this.http.post('/api/widget', { scriptID: this.scriptID, plugin: this.plugin }).subscribe((res: any) => {
      if (res.success) {
        this.html = res.content;
        this.apply(res.data, res.time);
      } else {
        alert(res.message);
      }
    });
  }

  private apply(data, time) {
    let rendered = this.render(this.html || '', data);
    this.content.nativeElement.innerHTML = rendered;
    this.lastTime = time;
  }

  private render(html: string, vars: any) {
    return html.replace(/@(\w+)/g, match => (vars[match.slice(1)] || '-'));
  }

  ngOnDestroy() {
    this.updater.unsubscribe();
    clearInterval(this.interval);
  }

  timeOf(): string {
    if (!this.lastTime) {
      return '-';
    } else {
      let ago = Date.now() - this.lastTime;
      if (ago < 60000) {
        return (ago / 1000).toFixed(0) + "s ago";
      } else {
        return (ago / 60000).toFixed(0) + "m ago";
      }
    }
  }
}
