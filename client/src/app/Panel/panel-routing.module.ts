import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RootComponent } from './Components/root/root.component';
import { OverviewComponent } from './Components/overview/overview.component';
import { AddscriptComponent } from './Components/addscript/addscript.component';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild([
      { path: '', component: RootComponent, children: [
        { path: '', component: OverviewComponent },
        { path: 'addscript', component: AddscriptComponent }
      ]}
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class PanelRoutingModule { }
