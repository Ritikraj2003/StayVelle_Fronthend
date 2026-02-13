import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainRoutingModule } from './main-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserAddComponent } from './users/user-add/user-add.component';
import { SettingsComponent } from './settings/settings.component';
import { CurrentBookingComponent } from './reservations/currentbooking/currentbooking.component';
import { RoomBookingComponent } from './room-booking/room-booking.component';
import { ReservationComponent } from './reservations/reservation/reservation.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { HousekeepingListComponent } from './housekeeping/housekeeping-list/housekeeping-list.component';
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
    CurrentBookingComponent,
    RoomBookingComponent,
    ReservationComponent,
    CheckoutComponent,
    HousekeepingListComponent
  ]
})
export class MainModule { }

