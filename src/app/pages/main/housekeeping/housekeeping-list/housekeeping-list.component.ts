import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { LoaderService } from '../../../../core/services/loader.service';

@Component({
  selector: 'app-housekeeping-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './housekeeping-list.component.html',
  styleUrl: './housekeeping-list.component.css'
})
export class HousekeepingListComponent implements OnInit {
  allHousekeeping: any[] = []; // Store all housekeeping records
  filteredHousekeeping: any[] = []; // Store filtered records for display
  isLoading: boolean = false;
  showEditForm: boolean = false;
  isEditMode: boolean = false;
  currentTaskId: number | null = null;
  
  // Filter properties
  filterStartDate: string = '';
  filterEndDate: string = '';
  filterStatus: string = '';
  filterRoom: string = '';
  
  // Active filters array
  activeFilters: Array<{type: string, label: string, value: string}> = [];

  // Edit form
  housekeepingForm: FormGroup;
  
  // Multiple image upload
  selectedImages: File[] = [];
  imagePreviews: string[] = [];
  existingImages: string[] = []; // Images from existing task

  constructor(
    private router: Router,
    private apiService: ApiService,
    private fb: FormBuilder,
    private loaderService: LoaderService
  ) {
    this.housekeepingForm = this.fb.group({
      roomId: ['', [Validators.required]],
      bookingId: [''],
      taskType: ['', [Validators.required]],
      taskStatus: ['', [Validators.required]],
      roomImage: [''],
      assignedToUserId: ['']
    });
  }

  ngOnInit(): void {
    this.loadHousekeeping();
  }

  loadHousekeeping(): void {
    this.isLoading = true;
    this.loaderService.show();
    this.apiService.get<any[]>('HousekeepingTask').subscribe({
      next: (data) => {
        this.allHousekeeping = data || [];
        this.filteredHousekeeping = [...this.allHousekeeping];
        this.isLoading = false;
        this.loaderService.hide();
      },
      error: (error) => {
        console.error('Error loading housekeeping tasks:', error);
        this.isLoading = false;
        // Fallback to empty array on error
        this.allHousekeeping = [];
        this.filteredHousekeeping = [];
        this.loaderService.hide();
      }
    });
  }

  editHousekeeping(task: any): void {
    this.isEditMode = true;
    this.currentTaskId = task.taskId;
    this.showEditForm = true;
    
    // Populate form with task data
    this.housekeepingForm.patchValue({
      roomId: task.roomId || '',
      bookingId: task.bookingId || '',
      taskType: task.taskType || '',
      taskStatus: task.taskStatus || '',
      roomImage: task.roomImage || '',
      assignedToUserId: task.assignedToUserId || ''
    });
    
    // Load existing images if available
    this.selectedImages = [];
    this.imagePreviews = [];
    this.existingImages = [];
    
    if (task.roomImage) {
      try {
        // Try to parse as JSON array (multiple images)
        const parsed = JSON.parse(task.roomImage);
        if (Array.isArray(parsed)) {
          this.existingImages = parsed;
        } else {
          // Single image (backward compatibility)
          this.existingImages = [task.roomImage];
        }
      } catch {
        // Not JSON, treat as single image (backward compatibility)
        this.existingImages = [task.roomImage];
      }
    }
  }

  cancelEdit(): void {
    this.showEditForm = false;
    this.isEditMode = false;
    this.currentTaskId = null;
    this.housekeepingForm.reset();
    this.selectedImages = [];
    this.imagePreviews = [];
    this.existingImages = [];
  }

  async onSubmit(): Promise<void> {
    if (this.housekeepingForm.valid) {
      const formData = await this.prepareFormData();
      
      // Log to console as requested
      console.log('Housekeeping Task Data:', formData);
      
      this.isLoading = true;

      if (this.isEditMode && this.currentTaskId) {
        // Update existing task
        this.loaderService.show();
        this.apiService.put<any>(`HousekeepingTask/${this.currentTaskId}`, formData).subscribe({
          next: (response) => {
            this.loadHousekeeping();
            this.cancelEdit();
            alert('Housekeeping task updated successfully!');
            this.loaderService.hide();
          },
          error: (error) => {
            console.error('Error updating housekeeping task:', error);
            alert('Error updating housekeeping task. Please try again.');
            this.isLoading = false;
            this.loaderService.hide();
          }
        });
      } else {
        // Create new task
        this.loaderService.show();
        this.apiService.post<any>('HousekeepingTask', formData).subscribe({
          next: (response) => {
            this.loadHousekeeping();
            this.cancelEdit();
            alert('Housekeeping task created successfully!');
            this.loaderService.hide();
          },
          error: (error) => {
            console.error('Error creating housekeeping task:', error);
            alert('Error creating housekeeping task. Please try again.');
            this.isLoading = false;
            this.loaderService.hide();
          }
        });
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.housekeepingForm.controls).forEach(key => {
        this.housekeepingForm.get(key)?.markAsTouched();
      });
    }
  }

  private async prepareFormData(): Promise<any> {
    const formValue = this.housekeepingForm.value;
    
    // Collect all images: existing + newly selected
    const allImages: string[] = [];
    
    // Add existing images (not removed)
    allImages.push(...this.existingImages);
    
    // Convert newly selected images to base64
    for (const file of this.selectedImages) {
      const base64 = await this.fileToBase64(file);
      allImages.push(base64);
    }
    
    // Store as JSON array string
    const roomImageJson = allImages.length > 0 ? JSON.stringify(allImages) : null;
    
    return {
      roomId: parseInt(formValue.roomId),
      bookingId: formValue.bookingId ? parseInt(formValue.bookingId) : null,
      taskType: formValue.taskType,
      taskStatus: formValue.taskStatus,
      roomImage: roomImageJson,
      assignedToUserId: formValue.assignedToUserId ? parseInt(formValue.assignedToUserId) : null
    };
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      
      // Validate and process each file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      for (const file of files) {
        // Validate file type
        if (!validTypes.includes(file.type)) {
          alert(`File ${file.name} is not a valid image type. Please select only jpg, jpeg, png, or svg files`);
          continue;
        }
        
        // Validate file size
        if (file.size > maxSize) {
          alert(`Image ${file.name} size should be less than 5MB`);
          continue;
        }
        
        // Add to selected images
        this.selectedImages.push(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result as string);
        };
        reader.readAsDataURL(file);
      }
      
      input.value = ''; // Clear the input
    }
  }

  removeNewImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  removeExistingImage(index: number): void {
    this.existingImages.splice(index, 1);
  }

  getAllImages(): string[] {
    return [...this.existingImages, ...this.imagePreviews];
  }

  deleteHousekeeping(task: any): void {
    if (confirm('Are you sure you want to delete this housekeeping record? This action cannot be undone.')) {
      this.isLoading = true;
      this.loaderService.show();
      this.apiService.delete<any>(`HousekeepingTask/${task.taskId}`).subscribe({
        next: () => {
          this.loadHousekeeping();
          alert('Housekeeping task deleted successfully!');
          this.loaderService.hide();
        },
        error: (error) => {
          console.error('Error deleting housekeeping task:', error);
          alert('Error deleting housekeeping task. Please try again.');
          this.isLoading = false;
          this.loaderService.hide();
        }
      });
    }
  }

  showAddForm(): void {
    this.isEditMode = false;
    this.currentTaskId = null;
    this.showEditForm = true;
    this.housekeepingForm.reset();
    this.selectedImages = [];
    this.imagePreviews = [];
    this.existingImages = [];
  }

  applyFilters(): void {
    let filtered = [...this.allHousekeeping];
    
    // Filter by date range (using createdOn)
    if (this.filterStartDate || this.filterEndDate) {
      filtered = filtered.filter(item => {
        if (!item.createdOn) return false;
        
        const createdDate = new Date(item.createdOn);
        const startDate = this.filterStartDate ? new Date(this.filterStartDate) : null;
        const endDate = this.filterEndDate ? new Date(this.filterEndDate) : null;
        
        // Set time to start of day for accurate comparison
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        createdDate.setHours(0, 0, 0, 0);
        
        const afterStart = !startDate || createdDate >= startDate;
        const beforeEnd = !endDate || createdDate <= endDate;
        
        return afterStart && beforeEnd;
      });
    }
    
    // Filter by status
    if (this.filterStatus && this.filterStatus !== 'Select' && this.filterStatus !== '') {
      filtered = filtered.filter(item => {
        return item.taskStatus && item.taskStatus.toLowerCase() === this.filterStatus.toLowerCase();
      });
    }
    
    // Filter by room
    if (this.filterRoom && this.filterRoom.trim() !== '') {
      const roomFilter = this.filterRoom.trim();
      filtered = filtered.filter(item => {
        return item.room && item.room.roomNumber && item.room.roomNumber.toString().includes(roomFilter);
      });
    }
    
    this.filteredHousekeeping = filtered;
  }

  onSearch(): void {
    // Clear previous filters
    this.activeFilters = [];
    
    // Add active filters based on selected values
    if (this.filterStartDate) {
      this.activeFilters.push({
        type: 'startDate',
        label: 'Start: ' + this.formatDateForDisplay(this.filterStartDate),
        value: this.filterStartDate
      });
    }
    
    if (this.filterEndDate) {
      this.activeFilters.push({
        type: 'endDate',
        label: 'End: ' + this.formatDateForDisplay(this.filterEndDate),
        value: this.filterEndDate
      });
    }
    
    if (this.filterStatus && this.filterStatus !== 'Select' && this.filterStatus !== '') {
      this.activeFilters.push({
        type: 'status',
        label: this.filterStatus,
        value: this.filterStatus
      });
    }
    
    if (this.filterRoom && this.filterRoom.trim() !== '') {
      this.activeFilters.push({
        type: 'room',
        label: this.filterRoom,
        value: this.filterRoom
      });
    }
    
    // Apply filters to the data
    this.applyFilters();
  }

  removeFilter(filterType: string): void {
    // Clear the corresponding form field
    if (filterType === 'startDate') {
      this.filterStartDate = '';
    } else if (filterType === 'endDate') {
      this.filterEndDate = '';
    } else if (filterType === 'status') {
      this.filterStatus = '';
    } else if (filterType === 'room') {
      this.filterRoom = '';
    }
    
    // Re-apply search with remaining filters (this will update activeFilters)
    this.onSearch();
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    const statusLower = status.toLowerCase().replace(/\s+/g, '-');
    return statusLower;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  }
}

