import { Component, OnInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../Services/socket.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-plugin',
  templateUrl: './plugin.component.html',
  styleUrls: ['./plugin.component.scss']
})
export class PluginComponent implements OnInit, OnDestroy {

  @ViewChild('frame') private frame: ElementRef<HTMLIFrameElement>;

  @HostListener('window:beforeunload') private disconnect() {
    this.http.post('/api/closepage', { scriptID: this.scriptID, plugin: this.plugin, village: this.village }).subscribe(console.log);
  }

  updater;

  private scriptID;
  private plugin;
  private village;

  constructor(private http: HttpClient, private socket: SocketService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.scriptID = this.route.snapshot.params.id;
    this.plugin = this.route.snapshot.params.name;
    this.village = this.route.snapshot.params.village;
    let frameWindow = this.frame.nativeElement.contentWindow;

    let output = this.socket.pluginOutput(this.scriptID, this.plugin, this.village);
    let handlers: Function[] = [];
    let input = callback => handlers.push(callback);

    this.updater = this.socket.plugin(this.scriptID, this.plugin, this.village).subscribe(data => {
      handlers.forEach(handler => handler(data));
    });

    this.http.post('/api/openpage', { scriptID: this.scriptID, plugin: this.plugin, village: this.village }).subscribe((res: any) => {
      if (res.success) {
        frameWindow.document.body.innerHTML = res.page;
        let runtime = eval("(" + res.runtime + ")");
        return runtime(frameWindow, input, output);
      } else {
        alert(res.message);
      }
    });


  }

  ngOnDestroy() {
    this.updater.unsubscribe();
    this.disconnect();
  }

}
