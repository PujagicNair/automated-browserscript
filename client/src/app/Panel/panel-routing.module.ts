import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RootComponent } from './Components/root/root.component';
import { OverviewComponent } from './Components/overview/overview.component';
import { AddscriptComponent } from './Components/addscript/addscript.component';
import { ScriptComponent } from './Components/script/script.component';
import { PluginComponent } from './Components/plugin/plugin.component';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild([
      { path: '', component: RootComponent, children: [
        { path: '', component: OverviewComponent },
        { path: 'addscript', component: AddscriptComponent },

        { path: 'script/:id', component: ScriptComponent },
        { path: 'script/:id/:village', component: ScriptComponent },
        { path: 'script/:id/:village/plugin/:name', component: PluginComponent }
      ]}
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class PanelRoutingModule { }
