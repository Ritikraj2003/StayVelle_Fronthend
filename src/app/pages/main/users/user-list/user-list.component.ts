import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { PermissionService } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  allUsers: any[] = []; // Store all users from API
  filteredUsers: any[] = []; // Store filtered users for display
  roles: any[] = []; // Store roles for filter dropdown
  
  // Filter properties
  filterName: string = '';
  filterRole: string = '';
  filterStatus: string = '';
  
  // Active filters array
  activeFilters: Array<{type: string, label: string, value: string}> = [];

  constructor(
    private apiService: ApiService,
    private router: Router,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.getUsers();
    this.loadRoles();
  }

  loadRoles(): void {
    this.apiService.getRoles().subscribe({
      next: (roles) => {
        // Filter only active roles
        this.roles = roles.filter((role: any) => role.isactive);
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.roles = [];
      }
    });
  }

  getUsers(): void {
    this.apiService.getUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        // Initially show all users, filters will be applied only on Search button click
        this.filteredUsers = [...this.allUsers];
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.allUsers = [];
        this.filteredUsers = [];
      }
    });
  }

  editUser(id: number): void {
    this.router.navigate(['/main/users/edit', id]);
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.apiService.deleteUser(id).subscribe({
        next: () => {
          // Reload users after deletion
          this.getUsers();
          // Re-apply filters if any are active
          if (this.filterName || this.filterRole || this.filterStatus) {
            this.applyFilters();
          }
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          const errorMessage = error.error?.message || 'Error deleting user. Please try again.';
          alert(errorMessage);
        }
      });
    }
  }

  applyFilters(): void {
    let filtered = [...this.allUsers];
    
    // Filter by name
    if (this.filterName && this.filterName.trim() !== '') {
      const nameFilter = this.filterName.toLowerCase().trim();
      filtered = filtered.filter(user => 
        (user.Name && user.Name.toLowerCase().includes(nameFilter)) ||
        (user.name && user.name.toLowerCase().includes(nameFilter)) ||
        (user.Email && user.Email.toLowerCase().includes(nameFilter)) ||
        (user.email && user.email.toLowerCase().includes(nameFilter)) ||
        (user.Username && user.Username.toLowerCase().includes(nameFilter)) ||
        (user.username && user.username.toLowerCase().includes(nameFilter))
      );
    }
    
    // Filter by role
    if (this.filterRole && this.filterRole !== 'Select' && this.filterRole !== '') {
      filtered = filtered.filter(user => {
        const userRole = user.role_name || user.role?.name || user.role || '';
        return userRole === this.filterRole;
      });
    }
    
    // Filter by status
    if (this.filterStatus && this.filterStatus !== 'Select' && this.filterStatus !== '') {
      const isActive = this.filterStatus === 'Active';
      filtered = filtered.filter(user => {
        const userStatus = user.isactive !== undefined ? user.isactive : 
                          (user.is_active !== undefined ? user.is_active : user.isActive);
        return userStatus === isActive;
      });
    }
    
    this.filteredUsers = filtered;
  }

  onSearch(): void {
    // Clear previous filters
    this.activeFilters = [];
    
    // Add active filters based on selected values
    if (this.filterName && this.filterName.trim() !== '') {
      this.activeFilters.push({
        type: 'name',
        label:this.filterName,
        value: this.filterName
      });
    }
    
    if (this.filterRole && this.filterRole !== 'Select' && this.filterRole !== '') {
      this.activeFilters.push({
        type: 'role',
        label: this.filterRole,
        value: this.filterRole
      });
    }
    
    if (this.filterStatus && this.filterStatus !== 'Select' && this.filterStatus !== '') {
      this.activeFilters.push({
        type: 'status',
        label: this.filterStatus,
        value: this.filterStatus
      });
    }
    
    // Apply filters to the data
    this.applyFilters();
  }

  removeFilter(filterType: string): void {
    // Clear the corresponding form field
    if (filterType === 'name') {
      this.filterName = '';
    } else if (filterType === 'role') {
      this.filterRole = '';
    } else if (filterType === 'status') {
      this.filterStatus = '';
    }
    
    // Re-apply search with remaining filters (this will update activeFilters)
    this.onSearch();
  }
}

