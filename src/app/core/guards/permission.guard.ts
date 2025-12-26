import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['permission'] as { module: string; action: string };
    const requiredPermissions = route.data['permissions'] as { module: string; action: string }[];

    if (requiredPermission) {
      if (!this.permissionService.hasPermission(requiredPermission.module, requiredPermission.action)) {
        this.router.navigate(['/main/dashboard']);
        return false;
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const requireAll = route.data['requireAll'] as boolean || false;
      
      if (requireAll) {
        if (!this.permissionService.hasAllPermissions(requiredPermissions)) {
          this.router.navigate(['/main/dashboard']);
          return false;
        }
      } else {
        if (!this.permissionService.hasAnyPermission(requiredPermissions)) {
          this.router.navigate(['/main/dashboard']);
          return false;
        }
      }
    }

    return true;
  }
}

