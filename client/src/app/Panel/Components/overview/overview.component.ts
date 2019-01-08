import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {

  constructor() { }

  scripts = [
    {
      name: 'Main Acc',
      world: 'DE161',
      status: 'running',
      price: 44,
      effects: [
        'crash-protection',
        'auto-palladin',
        'attack-notify'
      ],
      settings: [{
        key: 'ticks', value : 25
      }]
    },
    {
      name: 'Off Acc',
      world: 'DE161',
      status: 'paused',
      price: 21,
      effects: [
        'max-mines'
      ],
      settings: [{
        key: 'ticks', value : 10
      }]
    }
  ]

  ngOnInit() {
  }

}
