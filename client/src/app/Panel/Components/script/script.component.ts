import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../Services/socket.service';

@Component({
  selector: 'app-script',
  templateUrl: './script.component.html',
  styleUrls: ['./script.component.scss']
})
export class ScriptComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private http: HttpClient, private socket: SocketService) { }

  script;
  defaultUpdater;

  ngOnInit() {
    let scriptID = this.route.snapshot.params.id;
    
    this.http.get('/api/script/' + scriptID).subscribe((res: any) => {
      console.log(res);
      
      if (res.success) {
        let script = res.script;
        this.script = script;
      }
    });

    this.defaultUpdater = this.socket.default().subscribe(data => {
      if (this.script && data.scriptID == this.script._id && data.action == 'status') {
        this.script.status = data.data;
      }
    });
  }

  shouldShow(plugin) {
    let setup = this.script.pluginData[plugin].pluginSetup;
    return setup.hasPage || setup.hasWidget;
  }

  editPluginOrder() {
    // TODO
  }

  ngOnDestroy() {
    this.defaultUpdater.unsubscribe();
  }
}
