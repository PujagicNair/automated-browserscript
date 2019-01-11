import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RootComponent } from './Components/root/root.component';
import { OverviewComponent } from './Components/overview/overview.component';
import { AddscriptComponent } from './Components/addscript/addscript.component';
import { ScriptComponent } from './Components/script/script.component';
import { SummaryComponent } from './Components/summary/summary.component';
import { PluginComponent } from './Components/plugin/plugin.component';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild([
      { path: '', component: RootComponent, children: [
        { path: '', component: OverviewComponent },
        { path: 'addscript', component: AddscriptComponent },
        { path: 'script/:id', component: ScriptComponent, children: [
          { path: '', component: SummaryComponent },
          { path: 'plugin/:name', component: PluginComponent }
        ]}
      ]}
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class PanelRoutingModule { }
