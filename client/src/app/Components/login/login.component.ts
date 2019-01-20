import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  username: string = '';

  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit() {
  }

  login() {
    this.http.post('/login', { username: this.username }).subscribe((res: any) => {
      if (res.success) {
        this.router.navigateByUrl('/panel');
      } else {
        alert('failed login');
      }
    });
  }

}
