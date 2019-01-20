import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './Components/app.component';
import { NavigationComponent } from './Components/navigation/navigation.component';
import { RootComponent } from './Components/root/root.component';
import { OverviewComponent } from './Components/overview/overview.component';
import { LoginComponent } from './Components/login/login.component';
import { RegisterComponent } from './Components/register/register.component';
import { WorksComponent } from './Components/works/works.component';
import { MotivationComponent } from './Components/motivation/motivation.component';
import { TermsOfUseComponent } from './Components/terms-of-use/terms-of-use.component';


@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    RootComponent,
    OverviewComponent,
    LoginComponent,
    RegisterComponent,
    WorksComponent,
    MotivationComponent,
    TermsOfUseComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
