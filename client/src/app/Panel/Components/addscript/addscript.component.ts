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

  plugins;
  ngOnInit() {
    this.http.get('/api/createdata').subscribe((res: any) => {
      this.plugins = res.plugins;
    });
  }

  form = {
    server: "local1",
    serverCode: "",
    username: "",
    password: "",
    plugins: []
  };

  submit() {
    this.http.post('/api/create', this.form).subscribe((res: any) => {
      if (res.success) {
        this.router.navigateByUrl('/panel');
      } else {
        alert(res.message);
      }
    });
  }

  applyPlugin(plugin) {
    if (this.form.plugins.indexOf(plugin.name) != -1) {
      this.form.plugins.splice(this.form.plugins.indexOf(plugin.name), 1);
    } else {
      this.form.plugins.push(plugin.name);
    }
  }

  disabled(plugin) {
    let allReq = plugin.requires.some(plug => this.form.plugins.indexOf(plug) == -1);
    if (!allReq) {
      return false;
    } else {
      let needed = plugin.requires.filter(plug => this.form.plugins.indexOf(plug) == -1);
      return 'needed: ' + needed.join(', ');
    }
  }

  checked(name) {
    return this.form.plugins.indexOf(name) != -1;
  }
}
