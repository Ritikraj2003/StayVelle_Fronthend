import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  route?: string;
  children?: MenuItem[];
  hasDropdown?: boolean;
  permissionCode?: string | string[]; // Permission code(s) required to view this menu item (string for single, array for OR condition)
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  currentUser$ = this.authService.currentUser$;
  showProfileMenu: boolean = false;
  imageError: boolean = false;

  // Generic dropdown state management - works for any number of dropdowns
  dropdownStates: { [key: string]: boolean } = {};

  // Menu configuration with permission codes
  // Permission codes should match the permission_code from PermissionModel in backend
  allMenuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/main/dashboard',
      permissionCode: 'DS' // Dashboard permission code
    },
    {
      label: 'Reservations',
      hasDropdown: true,
      permissionCode: 'RB', // Reservations permission code (matches backend "RB" - Reservation | RoomBooking)
      children: [
        //{ label: 'Availability', route: '/main/reservations/availability', permissionCode: 'RS' },
        { label: 'Room Booking', route: '/main/room-booking', permissionCode: 'RB' },
        { label: 'Current Booking', route: '/main/reservations/current-booking', permissionCode: 'RB' },
        { label: 'Set Room Availability', route: '/main/reservations/set-availability', permissionCode: 'RB' },
        // { label: 'Booking History', route: '/main/booking-history', permissionCode: 'RB' }, // Using same permission as Reservations
        { label: 'Booking History', route: '/main/paymentpage', permissionCode: 'RB' }, // Using same permission as Reservations
      ]
    },
    {
      label: 'Front Desk',
      route: '/main/front-desk',
      hasDropdown: false,
      permissionCode: 'FD' // Front Desk permission code
    },
    {
      label: 'House keeping',
      route: '/main/housekeeping',
      permissionCode: 'HK' // Housekeeping permission code
    },
    {
      label: 'Message Management',
      route: '/main/messages',
      permissionCode: 'MM' // Message Management permission code
    },
    {
      label: 'Masters',
      hasDropdown: true,
      permissionCode: 'MS', // Masters permission code
      children: [
        { label: 'Room Master', route: '/main/masters/room-master', permissionCode: 'MS' },
        { label: 'Hotel Registration', route: '/main/masters/hotel-registration', permissionCode: 'MS' },
        { label: 'Service Master', route: '/main/masters/service-master', permissionCode: 'MS' }
      ]
    },
    {
      label: 'Property Setup',
      route: '/main/property-setup',
      hasDropdown: false,
      permissionCode: 'PS' // Property Setup permission code
    },
    {
      label: 'Revenue Management',
      route: '/main/revenue',
      hasDropdown: false,
      permissionCode: 'RM' // Revenue Management permission code
    },
    {
      label: 'User Management',
      hasDropdown: true,
      permissionCode: ['RU', 'RO'], // User Management - show if user has UM OR RO permission
      children: [
        { label: 'Roles & Permissions', route: '/main/roles-permissions', permissionCode: 'RO' },
        { label: 'Users', route: '/main/users', permissionCode: 'RU' }
      ]
    },
    {
      label: 'Reports',
      route: '/main/reports',
      hasDropdown: false,
      permissionCode: 'RT' // Reports permission code
    }

  ];

  // Filtered menu items based on permissions
  menuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.filterMenuItemsByPermissions();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateDropdownStates(event.url);
      });

    this.updateDropdownStates(this.router.url);

    this.currentUser$.subscribe(user => {
      this.imageError = false;
      this.filterMenuItemsByPermissions();
    });

    document.addEventListener('click', (event: any) => {
      if (!event.target.closest('.side_menu_blw_cntn')) {
        this.closeProfileMenu();
      }
    });
  }

  /**
   * Filter menu items based on user permissions
   */
  filterMenuItemsByPermissions(): void {
    this.menuItems = this.allMenuItems
      .map(item => ({ ...item, children: item.children ? [...item.children] : undefined }))
      .filter(item => {
        if (!item.permissionCode) {
          return false;
        }

        if (!this.permissionService.hasPermission(item.permissionCode)) {
          return false;
        }

        if (item.hasDropdown && item.children) {
          const filteredChildren = item.children.filter(child =>
            child.permissionCode && this.permissionService.hasPermission(child.permissionCode)
          );

          if (filteredChildren.length > 0) {
            item.children = filteredChildren;
            return true;
          }
          return false;
        }

        return true;
      });
  }

  /**
   * Generic method to update dropdown states based on current route
   * Works for any number of dropdown menus
   */
  updateDropdownStates(currentUrl: string): void {
    // Reset all dropdowns first
    Object.keys(this.dropdownStates).forEach(key => {
      this.dropdownStates[key] = false;
    });

    // Then open only the dropdown that matches current route
    this.menuItems.forEach(item => {
      if (item.hasDropdown && item.children) {
        const dropdownKey = this.getDropdownKey(item.label);
        // Check if any child route matches current URL
        let isOnChildRoute = item.children.some(child => {
          if (!child.route) return false;
          // Remove /main/ prefix for comparison
          const routePath = child.route.replace('/main/', '');
          // Check if current URL includes the route path
          return currentUrl.includes(routePath);
        });

        // Special handling for Reservations dropdown
        // Keep it open for reservation or checkout pages (related to Room Booking)
        if (item.label === 'Reservations' && !isOnChildRoute) {
          isOnChildRoute = currentUrl.includes('/main/reservations/reservation') ||
            currentUrl.includes('/main/checkout') ||
            currentUrl.includes('/main/add-update-servcie') ||
            currentUrl.includes('/main/room-booking/add-service');
        }

        this.dropdownStates[dropdownKey] = isOnChildRoute;
      }
    });
  }

  /**
   * Get dropdown key from menu label
   */
  getDropdownKey(label: string): string {
    return label.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Check if dropdown is open
   */
  isDropdownOpen(label: string): boolean {
    const key = this.getDropdownKey(label);
    return this.dropdownStates[key] || false;
  }

  /**
   * Toggle dropdown state
   */
  toggleDropdown(label: string): void {
    const key = this.getDropdownKey(label);
    this.dropdownStates[key] = !this.dropdownStates[key];
  }

  /**
   * Toggle profile menu
   */
  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  /**
   * Close profile menu
   */
  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }

  /**
   * Check if a child menu item should be active
   * Handles special cases like Room Booking -> Reservation/Checkout
   */
  isChildActive(childRoute: string | undefined, childLabel: string): boolean {
    const currentUrl = this.router.url;
    if (!currentUrl || !childRoute) return false;

    // Special handling for Room Booking
    // Keep it active when navigating to reservation or checkout pages
    if (childLabel === 'Room Booking' && childRoute === '/main/room-booking') {
      return currentUrl === '/main/room-booking' ||
        currentUrl.includes('/main/reservations/reservation') ||
        currentUrl.includes('/main/checkout') ||
        currentUrl.includes('/main/room-booking/add-service');
    }

    // Special handling for Current Booking
    // Keep it active when navigating to add/update service page
    if (childLabel === 'Current Booking' && childRoute === '/main/reservations/current-booking') {
      return currentUrl === '/main/reservations/current-booking' ||
        currentUrl.includes('/main/add-update-servcie');
    }

    // Default behavior: check if current URL matches or starts with the route
    // This handles cases like /main/users/add matching /main/users
    return currentUrl === childRoute || currentUrl.startsWith(childRoute + '/');
  }

  /**
   * Logout user
   */
  logout(): void {
    this.closeProfileMenu();
    this.authService.logout();
  }
}
