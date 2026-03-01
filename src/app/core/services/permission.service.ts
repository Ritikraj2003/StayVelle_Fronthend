import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Permission, User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly PERMISSIONS_KEY = 'user_permissions';

  constructor(private storageService: StorageService,) { }

  /**
   * Set permissions (called after login)
   */
  setPermissions(permissions: Permission[]): void {
    this.storageService.setItem(this.PERMISSIONS_KEY, permissions);
  }

  /**
   * Get permissions from localStorage
   */
  getPermissions(): Permission[] {
    return this.storageService.getItem<Permission[]>(this.PERMISSIONS_KEY) || [];
  }

  /**
   * Check if user has a specific permission by permission code (module)
   */
  hasPermission(permissionCode: string | string[]): boolean {

    // If user is admin, allow everything
    const user = this.storageService.getItem<User>("current_user");
    if (user?.isAdmin === true) {
      return true;
    }

    const permissions = this.getPermissions();
    const codes = Array.isArray(permissionCode) ? permissionCode : [permissionCode];

    return codes.some(code =>
      permissions.some(p =>
        p.module?.toLowerCase() === code.toLowerCase() ||
        p.name?.toLowerCase() === code.toLowerCase()
      )
    );
  }

  /**
   * Get the default route based on user permissions
   */
  getDefaultRoute(): string {
    const routeMappings = [
      { code: 'DS', route: '/main/dashboard' },
      { code: 'RB', route: '/main/room-booking' },
      { code: 'RC', route: '/main/reservations/current-booking' },
      { code: 'RH', route: '/main/booking-history' },
      { code: 'HK', route: '/main/housekeeping' },
      { code: 'MR', route: '/main/masters/room-master' },
      { code: 'MHR', route: '/main/masters/hotel-registration' },
      { code: 'MS', route: '/main/masters/service-master' },
      { code: 'MT', route: '/main/masters/tax-master' },
      { code: 'MB', route: '/main/masters/bill-master' },
      { code: 'RM', route: '/main/revenue' },
      { code: 'RO', route: '/main/roles-permissions' },
      { code: 'RU', route: '/main/users' }
    ];

    for (const mapping of routeMappings) {
      if (this.hasPermission(mapping.code)) {
        return mapping.route;
      }
    }

    return '/main/dashboard'; // Fallback
  }

  /**
   * Clear permissions (called on logout)
   */
  clearPermissions(): void {
    this.storageService.removeItem(this.PERMISSIONS_KEY);
  }
}
