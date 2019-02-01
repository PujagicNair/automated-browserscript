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

  ngOnInit() {
    
  }

  form = {
    map: "",
    server: "local1",
    serverCode: "",
    serverUrl: "die-staemme.de",
    username: "",
    password: "",
    plugins: ""
  };

  submit() {
    this.http.post('/api/create', this.form).subscribe(console.log);
  }
}
