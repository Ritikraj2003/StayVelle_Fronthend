import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PermissionService } from '../../../core/services/permission.service';

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
  activeFilters: Array<{type: string, label: string, value: string}> = [];

  constructor(
    private apiService: ApiService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.getRoles();
  }

  getRoles(): void {
    this.apiService.getRoles().subscribe({
      next: (roles) => {
        this.allRoles = roles;
        this.filteredRoles = [...this.allRoles];
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.allRoles = [];
        this.filteredRoles = [];
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
      alert('You do not have permission to delete roles.');
      return;
    }

    if (confirm('Are you sure you want to delete this role?')) {
      this.apiService.deleteRole(id).subscribe({
        next: () => {
          // Reload roles after deletion
          this.getRoles();
        },
        error: (error) => {
          console.error('Error deleting role:', error);
          alert('Error deleting role. Please try again.');
        }
      });
    }
  }
}

