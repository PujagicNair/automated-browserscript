import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {

  constructor(private http: HttpClient) { }

  scripts;

  ngOnInit() {
    this.http.get('/api/scripts').subscribe((scripts: any) => {
      this.scripts = scripts;
    });
  }

}
