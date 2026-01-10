import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoaderService } from '../../../../core/services/loader.service';

@Component({
  selector: 'app-user-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-add.component.html',
  styleUrl: './user-add.component.css'
})
export class UserAddComponent implements OnInit {
  userForm: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  originalImageUrl: string | null = null; // Store original image URL when editing
  roles: any[] = [];
  isLoading: boolean = false;
  isEditMode: boolean = false;
  userId: number | null = null;
  isLoadingUser: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private authService: AuthService,
    private loaderService: LoaderService
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      username: ['', [Validators.required]],
      isactive: [true],
      phone: ['', [Validators.required]],
      role_id: ['', [Validators.required]],
      role_name: [''],
      isstaff: [false],
      isadmin: [false]
    });

    // Update role_name when role_id changes
    this.userForm.get('role_id')?.valueChanges.subscribe(roleId => {
      const selectedRole = this.roles.find(r => (r.Id || r.id) === roleId);
      if (selectedRole) {
        this.userForm.patchValue({ role_name: selectedRole.role_name || selectedRole.name }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.userId = +params['id'];
        this.loadUserData(this.userId);
      }
    });
  }

  loadRoles(): void {
    this.loaderService.show();
    this.apiService.getRoles().subscribe({
      next: (roles) => {
        // Filter only active roles
        this.roles = roles.filter((role: any) => role.isactive);
        this.loaderService.hide();
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.roles = [];
        this.loaderService.hide();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0]; // Take only the first file
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (validTypes.includes(file.type)) {
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          alert('Image size should be less than 5MB');
          input.value = ''; // Clear the input
          return;
        }
        
        this.selectedImage = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          // Store the new base64 image
          this.imagePreview = e.target.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select only jpg, jpeg, png, or svg files');
        input.value = ''; // Clear the input
      }
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    // If in edit mode, restore original image, otherwise clear
    if (this.isEditMode && this.originalImageUrl) {
      this.imagePreview = this.originalImageUrl;
    } else {
      this.imagePreview = null;
    }
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  loadUserData(id: number): void {
    this.isLoadingUser = true;
    this.loaderService.show();
    this.apiService.getUserById(id).subscribe({
      next: (user) => {
        this.isLoadingUser = false;
        this.loaderService.hide();
        if (user) {
          // Populate form with user data
          this.userForm.patchValue({
            name: user.Name || user.name || '',
            email: user.Email || user.email || '',
            username: user.Username || user.username || '',
            phone: user.Phone || user.phone || '',
            isactive: user.isactive !== undefined ? user.isactive : true,
            isstaff: user.isstaff !== undefined ? user.isstaff : false,
            isadmin: user.isadmin !== undefined ? user.isadmin : false,
            role_id: user.role_id || user.roleId || '',
            role_name: user.role_name || user.roleName || ''
          });
          
          // Load image if exists
          if (user.ImageUrl || user.imageUrl) {
            const existingImageUrl = user.ImageUrl || user.imageUrl;
            this.imagePreview = existingImageUrl;
            this.originalImageUrl = existingImageUrl; // Store original image URL
          } else {
            this.originalImageUrl = null;
          }
          
          // Remove password requirement in edit mode
          this.userForm.get('password')?.clearValidators();
          this.userForm.get('password')?.updateValueAndValidity();
        }
      },
      error: (error) => {
        this.isLoadingUser = false;
        this.loaderService.hide();
        console.error('Error loading user:', error);
        alert('Error loading user data. Please try again.');
        this.router.navigate(['/main/users']);
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isLoading = true;
      this.loaderService.show();
      const formData = this.prepareFormData();
      
      if (this.isEditMode && this.userId) {
        // Update existing user
        this.apiService.updateUser(this.userId, formData).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.loaderService.hide();
            this.router.navigate(['/main/users']);
          },
          error: (error) => {
            this.isLoading = false;
            this.loaderService.hide();
            console.error('Error updating user:', error);
            const errorMessage = error.error?.message || 'Error updating user. Please try again.';
            alert(errorMessage);
          }
        });
      } else {
        // Create new user
        this.apiService.createUser(formData).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.loaderService.hide();
            this.router.navigate(['/main/users']);
          },
          error: (error) => {
            this.isLoading = false;
            this.loaderService.hide();
            console.error('Error creating user:', error);
            const errorMessage = error.error?.message || 'Error creating user. Please try again.';
            alert(errorMessage);
          }
        });
      }
    }
  }

  private prepareFormData(): any {
    const formValue = this.userForm.value;
    const selectedRole = this.roles.find(r => (r.Id || r.id) == formValue.role_id);
    const currentUser = this.authService.getCurrentUser()?.email || 'system';
    
    const data: any = {
      Name: formValue.name,
      Email: formValue.email,
      Username: formValue.username,
      isactive: formValue.isactive === true || formValue.isactive === 'true',
      Phone: formValue.phone,
      role_id: parseInt(formValue.role_id),
      role_name: selectedRole ? (selectedRole.role_name || selectedRole.name) : formValue.role_name,
      isstaff: formValue.isstaff === true || formValue.isstaff === 'true',
      isadmin: formValue.isadmin === true || formValue.isadmin === 'true'
    };
    
    // Handle image: 
    // 1. If new image was selected (selectedImage is not null), use the new base64 image
    // 2. If in edit mode and no new image selected, preserve the original image
    // 3. Otherwise, use whatever is in imagePreview (for new users)
    if (this.selectedImage !== null && this.imagePreview) {
      // New image was selected - use the new base64 string
      data.ImageUrl = this.imagePreview;
    } else if (this.isEditMode) {
      // In edit mode and no new image selected - preserve original image
      data.ImageUrl = this.originalImageUrl || this.imagePreview || null;
    } else {
      // Creating new user - use imagePreview if available
      data.ImageUrl = this.imagePreview || null;
    }
    
    // Only include password if provided (for edit mode) or required (for create mode)
    if (!this.isEditMode) {
      data.Password = formValue.password;
      data.CreatedBy = currentUser;
      data.CreatedOn = new Date().toISOString();
    } else if (formValue.password && formValue.password.trim() !== '') {
      // Only update password if user provided a new one
      data.Password = formValue.password;
    }
    
    return data;
  }

  cancel(): void {
    this.router.navigate(['/main/users']);
  }
}

