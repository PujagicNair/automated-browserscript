import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './Components/app.component';
import { NavigationComponent } from './Components/navigation/navigation.component';
import { RootComponent } from './Components/root/root.component';
import { OverviewComponent } from './Components/overview/overview.component';
import { MainComponent } from './Components/main/main.component';
import { SocketService } from './Services/socket.service';
import { TroopsComponent } from './Components/troops/troops.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    RootComponent,
    OverviewComponent,
    MainComponent,
    TroopsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    SocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
