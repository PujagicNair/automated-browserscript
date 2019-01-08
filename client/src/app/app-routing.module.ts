import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RootComponent } from './Components/root/root.component';
import { OverviewComponent } from './Components/overview/overview.component';
import { LoginComponent } from './Components/login/login.component';
import { RegisterComponent } from './Components/register/register.component';
import { WorksComponent } from './Components/works/works.component';
import { MotivationComponent } from './Components/motivation/motivation.component';
import { TermsOfUseComponent } from './Components/terms-of-use/terms-of-use.component';

const routes: Routes = [
  {
    path: '',
    component: RootComponent,
    children: [
      { path: '', component: OverviewComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'how-it-works', component: WorksComponent },
      { path: 'about', component: MotivationComponent },
      { path: 'terms', component: TermsOfUseComponent }
    ]
  },
  {
    path: 'panel',
    loadChildren: './Panel/panel.module#PanelModule'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
