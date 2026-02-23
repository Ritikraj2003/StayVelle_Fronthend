import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PermissionService } from '../../../core/services/permission.service';
import { LoaderService } from '../../../core/services/loader.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-roles-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './roles-permissions.component.html',
  styleUrl: './roles-permissions.component.css'
})
export class RolesPermissionsComponent implements OnInit {
  allRoles: any[] = []; // Store all roles from API
  filteredRoles: any[] = []; // Store filtered roles for display

  // Filter properties
  filterSearch: string = '';

  // Active filters array
  activeFilters: Array<{ type: string, label: string, value: string }> = [];
  public Math = Math;

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 5;

  get totalPages(): number {
    return Math.ceil(this.filteredRoles.length / this.pageSize);
  }

  get pagedRoles(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRoles.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  constructor(
    private apiService: ApiService,
    public permissionService: PermissionService,
    private loaderService: LoaderService,
    private notification: NotificationService
  ) { }

  ngOnInit(): void {
    this.getRoles();
  }

  getRoles(): void {
    this.loaderService.show();
    this.apiService.getRoles().subscribe({
      next: (roles) => {
        this.allRoles = roles;
        this.filteredRoles = [...this.allRoles];
        this.loaderService.hide();
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.allRoles = [];
        this.filteredRoles = [];
        this.loaderService.hide();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allRoles];

    // Filter by search (name or id)
    if (this.filterSearch && this.filterSearch.trim() !== '') {
      const searchFilter = this.filterSearch.toLowerCase().trim();
      filtered = filtered.filter(role =>
        (role.role_name && role.role_name.toLowerCase().includes(searchFilter)) ||
        (role.Id && role.Id.toString().includes(searchFilter)) ||
        (role.id && role.id.toString().includes(searchFilter))
      );
    }

    this.filteredRoles = filtered;
    this.currentPage = 1;
  }

  onSearch(): void {
    // Clear previous filters
    this.activeFilters = [];

    // Add active filter if search has value
    if (this.filterSearch && this.filterSearch.trim() !== '') {
      this.activeFilters.push({
        type: 'search',
        label: this.filterSearch,
        value: this.filterSearch
      });
    }

    // Apply filters to the data
    this.applyFilters();
  }

  removeFilter(filterType: string): void {
    // Clear the corresponding form field
    if (filterType === 'search') {
      this.filterSearch = '';
    }

    // Re-apply search with remaining filters (this will update activeFilters)
    this.onSearch();
  }

  deleteRole(id: number): void {
    if (!this.permissionService.hasPermission('RD')) {
      this.notification.warning('You do not have permission to delete roles.');
      return;
    }

    if (confirm('Are you sure you want to delete this role?')) {
      this.loaderService.show();
      this.apiService.deleteRole(id).subscribe({
        next: () => {
          // Reload roles after deletion
          this.getRoles();
          this.loaderService.hide();
        },
        error: (error) => {
          console.error('Error deleting role:', error);
          this.notification.error('Error deleting role. Please try again.');
          this.loaderService.hide();
        }
      });
    }
  }
}

