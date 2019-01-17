import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

declare var $;//: JQueryStatic;

interface Step {
  title: string;
  disabled(): boolean;
  data?: any;
  init?(action: 'next' | 'back'): void;
}

@Component({
  selector: 'app-addscript',
  templateUrl: './addscript.component.html',
  styleUrls: ['./addscript.component.scss']
})
export class AddscriptComponent implements OnInit {

  constructor(private http: HttpClient, private router: Router) { }

  data: any;
  userdata: any;
  output: string;

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
    { title: 'Plugins', data: { plugins: {} }, disabled() { return false } },
    { title: 'Configure Plugins', data: { plugin_config: {} }, disabled() { return false }, init: (action: 'next' | 'back') => {
      let selectedPlugins = this.steps[4].data.plugins;
      let pluginNames = Object.keys(selectedPlugins).filter(key => selectedPlugins[key]);
      let plugins = pluginNames.map(name => this.data.plugins.find(plugin => plugin.name == name));
      this.pluginConfig = plugins;
      if (!plugins.filter(plugin => plugin.config.length).length) {
        this[action]();
      } else {
        for (let plugin of plugins) {
          this.steps[5].data.plugin_config[plugin.name] = this.steps[5].data.plugin_config[plugin.name] || {};
        }
        
      }
    } },
    { title: 'Connect Account', data: {}, disabled() { return !this.data.username || !this.data.password }, init: () => this.userdata = undefined },
    { title: 'Summary', data: {}, disabled() { return true }, init: () => {
      let end = {};
      this.steps.forEach(step => {
        if (step.data) {
          Object.assign(end, step.data);
        }
      });
      this.userdata = end;
    }}
  ];

  pluginConfig: any[];

  next() {
    if (this.steps[this.step + 1] && !this.steps[this.step].disabled()) {
      this.step++;
      if (this.steps[this.step].init) {
        this.steps[this.step].init('next');
      }
    }
  }

  ticks = {
    label: "ticks every second",
    type: "radio",
    name: "ticks",
    values: ["10", "20", "40", "60", "100", "480"]
  }

  parseSummary() {
    let summary = Object.assign({}, this.userdata);
    summary.password = Array(summary.password.length).fill('*').join('');
    summary.plugins = Object.keys(summary.plugins).filter(key => summary.plugins[key]).join(', ');
    return Object.keys(summary).map(key => ({ key, value: summary[key] }));
  }

  back() {
    if (this.steps[this.step - 1]) {
      this.step--;
      if (this.steps[this.step].init) {
        this.steps[this.step].init('back');
      }
    }
  }

  get maps() {
    if (this.steps[1].data.server) {
      return this.data.servers.find(server => server.key == this.steps[1].data.server).maps;
    } else {
      return [];
    }
  }

  get scope() {
    return this.steps[this.step].data;
  }

  submit() {
    this.http.post('/api/create', this.userdata).subscribe((res: any) => {
      if (res.success) {
        this.router.navigateByUrl('/panel');
      }
      this.output = res.message;
    });
  }

}
