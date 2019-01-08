import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var $;//: JQueryStatic;

interface Step {
  title: string;
  disabled(): boolean;
  data?: any;
}

@Component({
  selector: 'app-addscript',
  templateUrl: './addscript.component.html',
  styleUrls: ['./addscript.component.scss']
})
export class AddscriptComponent implements OnInit {

  constructor(private http: HttpClient) { }

  data: any;

  ngOnInit() {
    this.http.get('/api/worlddatas').subscribe(data => {
      this.data = data;
    });
  }

  step = 0;
  steps: Step[] = [
    { title: 'Create a new script', disabled() { return false } }, // 0
    { title: 'Select a server', data: {}, disabled() { return !this.data.server } },
    { title: 'Select a map', data: {}, disabled() { return !this.data.map } },
    { title: 'Settings', data: {}, disabled() { return !this.data.ticks } },
    { title: 'Plugins', data: {}, disabled() { return false } },
    { title: 'Connect Account', data: {}, disabled() { return !this.data.username || !this.data.password } },
    { title: 'Summary', disabled() { return false } }
  ]

  next() {
    if (this.steps[this.step + 1] && !this.steps[this.step].disabled()) {
      this.step++;
    }
  }

  back() {
    if (this.steps[this.step - 1]) {
      this.step--;
    }
  }

  get maps() {
    if (this.steps[1].data.server) {
      return this.data.servers.find(server => server.key == this.steps[1].data.server).maps;
    } else {
      return [];
    }
  }

  get effects() {
    let server = this.steps[1].data.server;
    let map = this.steps[2].data.map;
    if (server && map) {
      return this.data.effects.filter(effect => !effect.maps || effect.maps.find(map => map.server == server && map.map == map));
    } else {
      return [];
    }
  }

}
