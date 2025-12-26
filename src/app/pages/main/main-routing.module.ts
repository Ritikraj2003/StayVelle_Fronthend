import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserAddComponent } from './users/user-add/user-add.component';
import { SettingsComponent } from './settings/settings.component';
import { AvailabilityComponent } from './reservations/availability/availability.component';
import { RolesPermissionsComponent } from './roles-permissions/roles-permissions.component';
import { RoleAddUpdateComponent } from './roles-permissions/role-add-update/role-add-update.component';
import { AuthGuard } from '../../core/guards/auth.guard';

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
    path: 'reservations/availability',
    component: AvailabilityComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    component: UserListComponent,
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
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }

