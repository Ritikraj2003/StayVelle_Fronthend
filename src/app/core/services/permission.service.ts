import { Injectable } from '@angular/core';
import { AuthService, Permission } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(private authService: AuthService) {}

  /**
   * Check if user has a specific permission
   */
  hasPermission(module: string, action: string): boolean {
    // Admin has all permissions
    if (this.authService.isAdmin()) {
      return true;
    }
    return this.authService.hasPermission(module, action);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: { module: string; action: string }[]): boolean {
    if (this.authService.isAdmin()) {
      return true;
    }
    return this.authService.hasAnyPermission(permissions);
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: { module: string; action: string }[]): boolean {
    if (this.authService.isAdmin()) {
      return true;
    }
    return permissions.every(p => this.authService.hasPermission(p.module, p.action));
  }

  /**
   * Get all permissions for current user
   */
  getPermissions(): Permission[] {
    return this.authService.getPermissions();
  }

  /**
   * Check if user can access a module
   */
  canAccessModule(module: string): boolean {
    if (this.authService.isAdmin()) {
      return true;
    }
    const permissions = this.getPermissions();
    return permissions.some(p => p.module.toLowerCase() === module.toLowerCase());
  }
}

