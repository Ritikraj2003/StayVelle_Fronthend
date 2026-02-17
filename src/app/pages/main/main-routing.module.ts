import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserAddComponent } from './users/user-add/user-add.component';
import { SettingsComponent } from './settings/settings.component';
import { CurrentBookingComponent } from './reservations/currentbooking/currentbooking.component';
import { RolesPermissionsComponent } from './roles-permissions/roles-permissions.component';
import { RoleAddUpdateComponent } from './roles-permissions/role-add-update/role-add-update.component';
import { MastersComponent } from './masters/masters.component';
import { RoomMasterComponent } from './masters/room-master/room-master.component';
import { RoomAddUpdateComponent } from './masters/room-master/room-add-update/room-add-update.component';
import { HotelRegistrationComponent } from './masters/hotel-registration/hotel-registration.component';
import { RoomBookingComponent } from './room-booking/room-booking.component';
import { ReservationComponent } from './reservations/reservation/reservation.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { HousekeepingListComponent } from './housekeeping/housekeeping-list/housekeeping-list.component';
import { BookingHistoryComponent } from './booking-history/booking-history.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ServiceMasterComponent } from './masters/service-master/service-master.component';
import { ServiceAddUpdateComponent } from './masters/service-master/service-add-update/service-add-update.component';
import { AddUpdateServcieComponent } from './add-update-servcie/add-update-servcie.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'reservations/current-booking',
    component: CurrentBookingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'room-booking',
    component: RoomBookingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'room-booking/add-service',
    component: AddUpdateServcieComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'reservations/reservation/:roomId',
    component: ReservationComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'checkout/:roomId/:roomNumber',
    component: CheckoutComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'checkout/:id',
    component: CheckoutComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'booking-history',
    component: BookingHistoryComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    component: UserListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'add-update-servcie',
    component: AddUpdateServcieComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users/add',
    component: UserAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users/edit/:id',
    component: UserAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'housekeeping',
    component: HousekeepingListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'roles-permissions',
    component: RolesPermissionsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'roles-permissions/add',
    component: RoleAddUpdateComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'roles-permissions/edit/:id',
    component: RoleAddUpdateComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'masters',
    component: MastersComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'room-master',
        pathMatch: 'full'
      },
      {
        path: 'room-master',
        component: RoomMasterComponent
      },
      {
        path: 'room-master/add',
        component: RoomAddUpdateComponent
      },
      {
        path: 'room-master/edit/:id',
        component: RoomAddUpdateComponent
      },
      {
        path: 'hotel-registration',
        component: HotelRegistrationComponent
      },
      {
        path: 'service-master',
        component: ServiceMasterComponent
      },
      {
        path: 'service-master/add',
        component: ServiceAddUpdateComponent
      },
      {
        path: 'service-master/edit/:id',
        component: ServiceAddUpdateComponent
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }

