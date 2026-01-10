import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { DashboardComponent } from './pages/main/dashboard/dashboard.component';
import { UserListComponent } from './pages/main/users/user-list/user-list.component';
import { UserAddComponent } from './pages/main/users/user-add/user-add.component';
import { SettingsComponent } from './pages/main/settings/settings.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    CommonModule,
    AppRoutingModule,
    AuthLayoutComponent,
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    LoginComponent,
    DashboardComponent,
    UserListComponent,
    UserAddComponent,
    SettingsComponent,
    NgbModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-center',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

