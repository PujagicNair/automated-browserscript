import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { OverviewComponent } from './Components/overview/overview.component';
import { RootComponent } from './Components/root/root.component';
import { AddscriptComponent } from './Components/addscript/addscript.component';
import { PanelRoutingModule } from './panel-routing.module';
import { DynFormComponent } from '../Panel/Components/dyn-form/dyn-form.component';





@NgModule({
  declarations: [
    OverviewComponent,
    RootComponent,
    AddscriptComponent,
    DynFormComponent
  ],
  imports: [
    CommonModule,
    PanelRoutingModule,
    HttpClientModule,
    FormsModule
  ]
})
export class PanelModule { }
