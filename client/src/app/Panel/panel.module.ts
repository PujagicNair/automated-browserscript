import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { OverviewComponent } from './Components/overview/overview.component';
import { RootComponent } from './Components/root/root.component';
import { AddscriptComponent } from './Components/addscript/addscript.component';
import { PanelRoutingModule } from './panel-routing.module';
import { DynFormComponent } from '../Panel/Components/dyn-form/dyn-form.component';
import { ScriptComponent } from '../Panel/Components/script/script.component';
import { SummaryComponent } from '../Panel/Components/summary/summary.component';
import { WidgetComponent } from '../Panel/Components/widget/widget.component';
import { PluginComponent } from '../Panel/Components/plugin/plugin.component';





@NgModule({
  declarations: [
    OverviewComponent,
    RootComponent,
    AddscriptComponent,
    DynFormComponent,
    ScriptComponent,
    SummaryComponent,
    WidgetComponent,
    PluginComponent
  ],
  imports: [
    CommonModule,
    PanelRoutingModule,
    HttpClientModule,
    FormsModule
  ]
})
export class PanelModule { }
