import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../Services/socket.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit, OnDestroy {

  constructor(private http: HttpClient, private socket: SocketService) { }

  scripts = [];
  updater;

  isOperating = true;

  ngOnInit() {
    this.http.get('/api/scripts').subscribe((scripts: any) => {
      this.scripts = scripts;
      this.isOperating = false;
    });

    this.updater = this.socket.default().subscribe(data => {
      let script = this.scripts.find(script => {
        return script._id == data.scriptID;
      });
      if (script && data.action == 'status') {
        script.status = data.data;
      }
    });
  }

  trigger(scriptID: string, action: string) {
    this.isOperating = true;
    this.http.post('/api/' + action, { scriptID }).subscribe((res: any) => {
      this.isOperating = false;
      if (res.success) {
        console.log('[success]', action);
      } else {
        alert(res.message);
      }
    });
  }

  ngOnDestroy() {
    this.updater.unsubscribe();
  }

}
