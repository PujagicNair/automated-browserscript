import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../Services/socket.service';

@Component({
  selector: 'app-script',
  templateUrl: './script.component.html',
  styleUrls: ['./script.component.scss']
})
export class ScriptComponent implements OnInit, OnDestroy {

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private socket: SocketService,
    private router: Router) { }

  script;
  defaultUpdater;
  villages = [];

  closed = {};

  ngOnInit() {
    let scriptID = this.route.snapshot.params.id;
    let villageID = this.route.snapshot.params.village;
    
    this.http.get('/api/script/' + scriptID).subscribe((res: any) => {
      if (res.success) {
        let script = res.script;
        this.script = script;
        if (!villageID) {
          this.router.navigate([script.villages[0].id], { relativeTo: this.route });
        }
      } else {
        alert(res.message);
        this.router.navigate(['..', '..'], { relativeTo: this.route });
      }
    });

    this.defaultUpdater = this.socket.default().subscribe(data => {
      if (this.script && data.scriptID == this.script._id && data.action == 'status') {
        this.script.status = data.data;
      }
    });
  }

  get villageID() {
    return this.route.snapshot.params.village;
  }

  shouldShow(plugin) {
    let setup = this.script.pluginSetup[plugin];
    return setup.hasPage || setup.hasWidget;
  }

  editPluginOrder() {
    // TODO
  }

  ngOnDestroy() {
    this.defaultUpdater.unsubscribe();
  }
}
