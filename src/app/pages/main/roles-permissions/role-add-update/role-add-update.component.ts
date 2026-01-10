import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { LoaderService } from '../../../../core/services/loader.service';

@Component({
  selector: 'app-role-add-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './role-add-update.component.html',
  styleUrl: './role-add-update.component.css'
})
export class RoleAddUpdateComponent implements OnInit {
  roleForm: FormGroup;
  roleId: number | null = null;
  isEditMode: boolean = false;
  isLoading: boolean = false;
  
  // Permissions from API
  allPermissions: any[] = [];
  availablePermissions: any[] = [];
  chosenPermissions: any[] = [];
  selectedAvailable: number[] = [];
  selectedChosen: number[] = [];
  searchAvailable: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private authService: AuthService,
    public permissionService: PermissionService,
    private loaderService: LoaderService
  ) {
    this.roleForm = this.fb.group({
      role_name: ['', [Validators.required]],
      isactive: [true]
    });
  }

  ngOnInit(): void {
    // Load all permissions first
    this.loadPermissions();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.roleId = +params['id'];
        this.isEditMode = true;
        this.loadRole(this.roleId);
      }
    });
  }

  loadPermissions(): void {
    this.loaderService.show();
    this.apiService.getPermissions().subscribe({
      next: (permissions) => {
        this.allPermissions = permissions;
        // If not in edit mode, all permissions are available
        if (!this.isEditMode) {
          this.availablePermissions = [...this.allPermissions];
          this.chosenPermissions = [];
        }
        this.loaderService.hide();
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
        this.allPermissions = [];
        this.availablePermissions = [];
        this.loaderService.hide();
      }
    });
  }

  loadRole(id: number): void {
    this.isLoading = true;
    this.loaderService.show();
    this.apiService.getRoleById(id).subscribe({
      next: (role) => {
        this.roleForm.patchValue({
          role_name: role.role_name,
          isactive: role.isactive
        });
        
        // Set permissions - role.permissions contains permission objects
        const permissionIds = role.permissions ? role.permissions.map((p: any) => p.Id || p.id) : [];
        this.setPermissions(permissionIds);
        this.isLoading = false;
        this.loaderService.hide();
      },
      error: (error) => {
        console.error('Error loading role:', error);
        alert('Error loading role. Please try again.');
        this.router.navigate(['/main/roles-permissions']);
        this.isLoading = false;
        this.loaderService.hide();
      }
    });
  }

  setPermissions(permissionIds: number[]): void {
    // Split permissions into available and chosen
    this.chosenPermissions = this.allPermissions.filter(perm => 
      permissionIds.includes(perm.Id || perm.id)
    );
    this.availablePermissions = this.allPermissions.filter(perm => 
      !permissionIds.includes(perm.Id || perm.id)
    );
  }

  get filteredAvailablePermissions(): any[] {
    if (!this.searchAvailable) {
      return this.availablePermissions;
    }
    const search = this.searchAvailable.toLowerCase();
    return this.availablePermissions.filter(perm => {
      const name = perm.permission_name || perm.name || '';
      const code = perm.permission_code || perm.code || '';
      return name.toLowerCase().includes(search) || code.toLowerCase().includes(search);
    });
  }

  toggleAvailableSelection(id: number): void {
    const index = this.selectedAvailable.indexOf(id);
    if (index > -1) {
      this.selectedAvailable.splice(index, 1);
    } else {
      this.selectedAvailable.push(id);
    }
  }

  toggleChosenSelection(id: number): void {
    const index = this.selectedChosen.indexOf(id);
    if (index > -1) {
      this.selectedChosen.splice(index, 1);
    } else {
      this.selectedChosen.push(id);
    }
  }

  moveToChosen(): void {
    const toMove = this.availablePermissions.filter(perm => 
      this.selectedAvailable.includes(perm.Id || perm.id)
    );
    this.chosenPermissions.push(...toMove);
    this.availablePermissions = this.availablePermissions.filter(perm => 
      !this.selectedAvailable.includes(perm.Id || perm.id)
    );
    this.selectedAvailable = [];
  }

  moveToAvailable(): void {
    const toMove = this.chosenPermissions.filter(perm => 
      this.selectedChosen.includes(perm.Id || perm.id)
    );
    this.availablePermissions.push(...toMove);
    this.chosenPermissions = this.chosenPermissions.filter(perm => 
      !this.selectedChosen.includes(perm.Id || perm.id)
    );
    this.selectedChosen = [];
  }

  chooseAll(): void {
    this.chosenPermissions.push(...this.availablePermissions);
    this.availablePermissions = [];
    this.selectedAvailable = [];
  }

  removeAll(): void {
    this.availablePermissions.push(...this.chosenPermissions);
    this.chosenPermissions = [];
    this.selectedChosen = [];
  }

  onSubmit(): void {
    if (this.roleForm.valid && this.chosenPermissions.length > 0) {
      this.isLoading = true;
      this.loaderService.show();
      const formData = this.prepareFormData();
      
      if (this.isEditMode && this.roleId) {
        this.apiService.updateRole(this.roleId, formData).subscribe({
          next: () => {
            this.isLoading = false;
            this.loaderService.hide();
            this.router.navigate(['/main/roles-permissions']);
          },
          error: (error) => {
            console.error('Error updating role:', error);
            alert(error.error?.message || 'Error updating role. Please try again.');
            this.isLoading = false;
            this.loaderService.hide();
          }
        });
      } else {
        this.apiService.createRole(formData).subscribe({
          next: () => {
            this.isLoading = false;
            this.loaderService.hide();
            this.router.navigate(['/main/roles-permissions']);
          },
          error: (error) => {
            console.error('Error creating role:', error);
            alert(error.error?.message || 'Error creating role. Please try again.');
            this.isLoading = false;
            this.loaderService.hide();
          }
        });
      }
    } else if (this.chosenPermissions.length === 0) {
      alert('Please select at least one permission for the role.');
    }
  }

  saveAndContinue(): void {
    if (this.roleForm.valid) {
      const formData = this.prepareFormData();
      console.log('Role data:', formData);
      // Stay on the same page for continued editing
      // API calls will be added later
    }
  }

  saveAndAddAnother(): void {
    if (this.roleForm.valid && this.chosenPermissions.length > 0) {
      this.isLoading = true;
      this.loaderService.show();
      const formData = this.prepareFormData();
      
      this.apiService.createRole(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.loaderService.hide();
          // Reset form for adding another role
          this.roleForm.reset({
            isactive: true
          });
          this.availablePermissions = [...this.allPermissions];
          this.chosenPermissions = [];
          this.selectedAvailable = [];
          this.selectedChosen = [];
          this.searchAvailable = '';
          this.isEditMode = false;
          this.roleId = null;
        },
        error: (error) => {
          console.error('Error creating role:', error);
          alert(error.error?.message || 'Error creating role. Please try again.');
          this.isLoading = false;
          this.loaderService.hide();
        }
      });
    } else if (this.chosenPermissions.length === 0) {
      alert('Please select at least one permission for the role.');
    }
  }

  private prepareFormData(): any {
    const formValue = this.roleForm.value;
    const selectedPermissions = this.chosenPermissions.map(perm => perm.Id || perm.id);
    
    // Get current user from auth service
    const currentUser = this.authService.getCurrentUser()?.email || 'system';
    
    return {
      role_name: formValue.role_name,
      isactive: formValue.isactive === true || formValue.isactive === 'true',
      permissionIds: selectedPermissions,
      createdBy: this.isEditMode ? '' : currentUser,
      modifiedBy: this.isEditMode ? currentUser : ''
    };
  }

  cancel(): void {
    this.router.navigate(['/main/roles-permissions']);
  }
}

