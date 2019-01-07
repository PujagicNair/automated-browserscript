import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../Services/socket.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {

  constructor(private sock: SocketService) { }

  ngOnInit() {
    this.sock.on('screenshot').subscribe(data=> {
      this['img'] = data;
    });
  }

}
