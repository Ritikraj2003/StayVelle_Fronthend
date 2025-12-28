import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainRoutingModule } from './main-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserAddComponent } from './users/user-add/user-add.component';
import { SettingsComponent } from './settings/settings.component';
import { AvailabilityComponent } from './reservations/availability/availability.component';
import { RoomBookingComponent } from './room-booking/room-booking.component';
import { ReservationComponent } from './reservations/reservation/reservation.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MainRoutingModule,
    DashboardComponent,
    UserListComponent,
    UserAddComponent,
    SettingsComponent,
    AvailabilityComponent,
    RoomBookingComponent,
    ReservationComponent
  ]
})
export class MainModule { }

