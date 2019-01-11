import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../Services/socket.service';

@Component({
  selector: 'app-script',
  templateUrl: './script.component.html',
  styleUrls: ['./script.component.scss']
})
export class ScriptComponent implements OnInit {

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  script;

  ngOnInit() {
    let scriptID = this.route.snapshot.params.id
    
    this.http.get('/api/script/' + scriptID).subscribe((res: any) => {
      if (res.success) {
        let script = res.script;
        this.script = script;
      }
    });
  }
}
