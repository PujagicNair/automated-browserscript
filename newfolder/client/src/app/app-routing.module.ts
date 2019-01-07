import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RootComponent } from './Components/root/root.component';
import { OverviewComponent } from './Components/overview/overview.component';
import { MainComponent } from './Components/main/main.component';
import { TroopsComponent } from './Components/troops/troops.component';

const routes: Routes = [
  {
    path: '',
    component: RootComponent,
    children: [
      { path: '', component: OverviewComponent },
      { path: 'main', component: MainComponent },
      { path: 'troops', component: TroopsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
