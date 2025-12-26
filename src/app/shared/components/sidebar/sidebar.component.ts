import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  route?: string;
  children?: MenuItem[];
  hasDropdown?: boolean;
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

  // Menu configuration - easy to add more dropdowns in the future
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/main/dashboard'
    },
    {
      label: 'Reservations',
      hasDropdown: true,
      children: [
        { label: 'Availability', route: '/main/reservations/availability' },
        { label: 'Current Booking', route: '/main/reservations/current-booking' },
        { label: 'Set Room Availability', route: '/main/reservations/set-availability' }
      ]
    },
    {
      label: 'Front Desk',
      route: '/main/front-desk',
      hasDropdown: false
    },
    {
      label: 'House keeping',
      route: '/main/housekeeping'
    },
    {
      label: 'Message Management',
      route: '/main/messages'
    },
    {
      label: 'Masters',
      route: '/main/masters'
    },
    {
      label: 'Property Setup',
      route: '/main/property-setup',
      hasDropdown: false
    },
    {
      label: 'Revenue Management',
      route: '/main/revenue',
      hasDropdown: false
    },
    {
      label: 'User Management',
      hasDropdown: true,
      children: [
        { label: 'Roles & Permissions', route: '/main/roles-permissions' },
        { label: 'Users', route: '/main/users' }
      ]
    },
    {
      label: 'Reports',
      route: '/main/reports',
      hasDropdown: false
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Auto-open/close dropdowns based on current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateDropdownStates(event.url);
      });

    // Check initial route
    this.updateDropdownStates(this.router.url);

    // Reset image error when user changes
    this.currentUser$.subscribe(user => {
      this.imageError = false;
    });

    // Close profile menu when clicking outside
    document.addEventListener('click', (event: any) => {
      if (!event.target.closest('.side_menu_blw_cntn')) {
        this.closeProfileMenu();
      }
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
        const isOnChildRoute = item.children.some(child => {
          if (!child.route) return false;
          // Remove /main/ prefix for comparison
          const routePath = child.route.replace('/main/', '');
          // Check if current URL includes the route path
          return currentUrl.includes(routePath);
        });
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
   * Logout user
   */
  logout(): void {
    this.closeProfileMenu();
    this.authService.logout();
  }
}
