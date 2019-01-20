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

  ngOnInit() {
    this.http.get('/api/scripts').subscribe((scripts: any) => {
      this.scripts = scripts;
    });

    this.updater = this.socket.default().subscribe(data => {
      console.log('default output', data);
      
      let script = this.scripts.find(script => {
        return script._id == data.scriptID;
      });
      if (script && data.action == 'status') {
        script.status = data.data;
      }
    });
  }

  ngOnDestroy() {
    this.updater.unsubscribe();
  }

}
