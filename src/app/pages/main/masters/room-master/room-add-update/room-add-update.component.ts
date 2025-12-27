import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../../core/services/api.service';


interface UploadedImage {
  file: File;
  name: string;
  preview: string;
}

@Component({
  selector: 'app-room-add-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './room-add-update.component.html',
  styleUrl: './room-add-update.component.css'
})
export class RoomAddUpdateComponent implements OnInit {
  roomForm: FormGroup;
  roomId: number | null = null;
  isEditMode: boolean = false;
  uploadedImages: UploadedImage[] = [];
  existingImages: string[] = []; // Images from API (base64 or URLs)
  
  // Room types
  roomTypes: string[] = ['Single', 'Double', 'Deluxe'];
  
  // Room statuses
  roomStatuses: string[] = ['Available', 'Blocked', 'Maintenance'];
  
  // Number of beds
  numberOfBeds: string[] = ['1', '2', '3'];
  
  // AC types
  acTypes: string[] = ['AC', 'Non-AC'];
  
  // Bathroom types
  bathroomTypes: string[] = ['Attached', 'Separate'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {
    this.roomForm = this.fb.group({
      roomNumber: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0)]],
      maxOccupancy: ['', [Validators.required, Validators.min(1)]],
      floor: ['', [Validators.required]],
      numberOfBeds: ['', [Validators.required]],
      acType: ['', [Validators.required]],
      bathroomType: ['', [Validators.required]],
      description: [''],
      isActive: [true],
      isTv: [false],
      roomType: ['', [Validators.required]],
      roomStatus: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.roomId = +params['id'];
        this.isEditMode = true;
        this.loadRoom(this.roomId);
      }
    });
  }

  loadRoom(id: number): void {
    this.apiService.getRoomById(id).subscribe({
      next: (room) => {
        this.roomForm.patchValue({
          roomNumber: room.roomNumber,
          price: room.price,
          maxOccupancy: room.maxOccupancy,
          floor: room.floor,
          numberOfBeds: room.numberOfBeds,
          acType: room.acType,
          bathroomType: room.bathroomType,
          description: room.description || '',
          isActive: room.isActive,
          isTv: room.isTv,
          roomType: room.roomType,
          roomStatus: room.roomStatus
        });
        
        // Load existing images
        if (room.images) {
          this.existingImages = Array.isArray(room.images) ? room.images : this.parseImages(room.images);
        }
      },
      error: (error) => {
        console.error('Error loading room:', error);
        alert('Failed to load room. Please try again.');
        this.router.navigate(['/main/masters/room-master']);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (validTypes.includes(file.type)) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.uploadedImages.push({
              file: file,
              name: file.name,
              preview: e.target.result
            });
          };
          reader.readAsDataURL(file);
        } else {
          alert('Please select only jpg, png, or svg files');
        }
      });
    }
  }

  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
  }

  async onSubmit(): Promise<void> {
    if (this.roomForm.valid) {
      const formData = await this.prepareFormData();
      
      if (this.isEditMode && this.roomId) {
        this.apiService.updateRoom(this.roomId, formData).subscribe({
          next: () => {
            this.router.navigate(['/main/masters/room-master']);
          },
          error: (error) => {
            console.error('Error updating room:', error);
            alert('Failed to update room. Please try again.');
          }
        });
      } else {
        this.apiService.createRoom(formData).subscribe({
          next: () => {
            this.router.navigate(['/main/masters/room-master']);
          },
          error: (error) => {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
          }
        });
      }
    }
  }

  async saveAndContinue(): Promise<void> {
    if (this.roomForm.valid) {
      const formData = await this.prepareFormData();
      
      if (this.isEditMode && this.roomId) {
        this.apiService.updateRoom(this.roomId, formData).subscribe({
          next: () => {
            // Reload room data to stay on page
            this.loadRoom(this.roomId!);
            alert('Room updated successfully!');
          },
          error: (error) => {
            console.error('Error updating room:', error);
            alert('Failed to update room. Please try again.');
          }
        });
      } else {
        this.apiService.createRoom(formData).subscribe({
          next: (room) => {
            // Switch to edit mode with new room ID
            this.roomId = room.id;
            this.isEditMode = true;
            this.router.navigate(['/main/masters/room-master/edit', this.roomId]);
            alert('Room created successfully!');
          },
          error: (error) => {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
          }
        });
      }
    }
  }

  async saveAndAddAnother(): Promise<void> {
    if (this.roomForm.valid) {
      const formData = await this.prepareFormData();
      
      if (this.isEditMode && this.roomId) {
        // Update current room first
        this.apiService.updateRoom(this.roomId, formData).subscribe({
          next: () => {
            // Reset form for adding another room
            this.resetFormForNewRoom();
          },
          error: (error) => {
            console.error('Error updating room:', error);
            alert('Failed to update room. Please try again.');
          }
        });
      } else {
        // Create room
        this.apiService.createRoom(formData).subscribe({
          next: () => {
            // Reset form for adding another room
            this.resetFormForNewRoom();
            alert('Room created successfully!');
          },
          error: (error) => {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
          }
        });
      }
    }
  }

  private resetFormForNewRoom(): void {
    this.roomForm.reset({
      isActive: true,
      isTv: false,
      roomType: '',
      roomStatus: '',
      floor: '',
      numberOfBeds: '',
      acType: '',
      bathroomType: ''
    });
    this.uploadedImages = [];
    this.existingImages = [];
    this.isEditMode = false;
    this.roomId = null;
  }

  private async prepareFormData(): Promise<any> {
    const formValue = this.roomForm.value;
    
    // Convert uploaded images to base64 strings
    const imagePromises = this.uploadedImages.map(img => this.fileToBase64(img.file));
    const newImages = await Promise.all(imagePromises);
    
    // Combine existing images with new images
    const allImages = [...this.existingImages, ...newImages];
    
    const baseData = {
      roomNumber: formValue.roomNumber,
      price: parseFloat(formValue.price),
      maxOccupancy: parseInt(formValue.maxOccupancy),
      floor: formValue.floor,
      numberOfBeds: formValue.numberOfBeds,
      acType: formValue.acType,
      bathroomType: formValue.bathroomType,
      description: formValue.description || '',
      isActive: formValue.isActive === true || formValue.isActive === 'true',
      isTv: formValue.isTv === true || formValue.isTv === 'true',
      roomType: formValue.roomType,
      roomStatus: formValue.roomStatus,
      images: allImages.length > 0 ? allImages : undefined
    };

    // Add createdBy and createdOn for new rooms
    if (!this.isEditMode) {
      return {
        ...baseData,
        createdBy: 'system', // You can get this from auth service
        createdOn: new Date().toISOString()
      };
    }

    return baseData;
  }

  private parseImages(imagesJson: string): string[] {
    if (!imagesJson) {
      return [];
    }
    try {
      return JSON.parse(imagesJson);
    } catch {
      // If parsing fails, return empty array or the string as single item
      return imagesJson ? [imagesJson] : [];
    }
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

  removeExistingImage(index: number): void {
    this.existingImages.splice(index, 1);
  }

  cancel(): void {
    this.router.navigate(['/main/masters/room-master']);
  }
}

