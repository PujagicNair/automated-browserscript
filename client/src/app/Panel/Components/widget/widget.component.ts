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
  wid;

  ngOnInit() {
    this.updater = this.socket.widget(this.scriptID, this.plugin).subscribe(data => {
      let rendered = this.wid && this.wid(data, this.render);
      this.content.nativeElement.innerHTML = rendered;
    });

    this.http.get('/testwidget').subscribe((data: any) => {
      this.wid = eval(data.tick);
    });
  }

  private render(vars: any, html: any) {
    return html.replace(/@(\w+)/, match => vars[match.slice(1)]);
  }

  ngOnDestroy() {
    this.updater.unsubscribe();
  }

}
