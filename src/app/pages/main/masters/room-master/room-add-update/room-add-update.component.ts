import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../../core/services/api.service';
import { LoaderService } from '../../../../../core/services/loader.service';


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
  existingImages: any[] = []; // Full Document objects from API

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
    private apiService: ApiService,
    private loaderService: LoaderService
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
    this.loaderService.show();
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

        if (room.documents && Array.isArray(room.documents)) {
          this.existingImages = room.documents;
        } else if (room.images) {
          // Fallback: wrap strings in object structure
          const imgs = Array.isArray(room.images) ? room.images : this.parseImages(room.images);
          this.existingImages = imgs.map((img: string) => ({ filePath: img }));
        }
        this.loaderService.hide();
      },
      error: (error) => {
        console.error('Error loading room:', error);
        alert('Failed to load room. Please try again.');
        this.loaderService.hide();
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
      this.loaderService.show();
      this.loaderService.show();
      const formData = await this.prepareFormData();

      if (this.isEditMode && this.roomId) {
        this.apiService.updateRoom(this.roomId, formData).subscribe({
          next: () => {
            this.loaderService.hide();
            this.router.navigate(['/main/masters/room-master']);
          },
          error: (error) => {
            console.error('Error updating room:', error);
            alert('Failed to update room. Please try again.');
            this.loaderService.hide();
          }
        });
      } else {
        this.apiService.createRoom(formData).subscribe({
          next: () => {
            this.loaderService.hide();
            this.router.navigate(['/main/masters/room-master']);
          },
          error: (error) => {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
            this.loaderService.hide();
          }
        });
      }
    }
  }

  async saveAndContinue(): Promise<void> {
    if (this.roomForm.valid) {
      this.loaderService.show();
      this.loaderService.show();
      const formData = await this.prepareFormData();

      if (this.isEditMode && this.roomId) {
        this.apiService.updateRoom(this.roomId, formData).subscribe({
          next: () => {
            // Reload room data to stay on page
            this.loadRoom(this.roomId!);
            alert('Room updated successfully!');
            this.loaderService.hide();
          },
          error: (error) => {
            console.error('Error updating room:', error);
            alert('Failed to update room. Please try again.');
            this.loaderService.hide();
          }
        });
      } else {
        this.apiService.createRoom(formData).subscribe({
          next: (room) => {
            // Switch to edit mode with new room ID
            this.roomId = room.id;
            this.isEditMode = true;
            this.loaderService.hide();
            this.router.navigate(['/main/masters/room-master/edit', this.roomId]);
            alert('Room created successfully!');
          },
          error: (error) => {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
            this.loaderService.hide();
          }
        });
      }
    }
  }

  async saveAndAddAnother(): Promise<void> {
    if (this.roomForm.valid) {
      this.loaderService.show();
      this.loaderService.show();
      const formData = await this.prepareFormData();

      if (this.isEditMode && this.roomId) {
        // Update current room first
        this.apiService.updateRoom(this.roomId, formData).subscribe({
          next: () => {
            // Reset form for adding another room
            this.resetFormForNewRoom();
            this.loaderService.hide();
          },
          error: (error) => {
            console.error('Error updating room:', error);
            alert('Failed to update room. Please try again.');
            this.loaderService.hide();
          }
        });
      } else {
        // Create room
        this.apiService.createRoom(formData).subscribe({
          next: () => {
            // Reset form for adding another room
            this.resetFormForNewRoom();
            alert('Room created successfully!');
            this.loaderService.hide();
          },
          error: (error) => {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
            this.loaderService.hide();
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

  private async prepareFormData(): Promise<FormData> {
    const formValue = this.roomForm.value;
    const formData = new FormData();

    formData.append('RoomNumber', formValue.roomNumber);
    formData.append('Price', formValue.price);
    formData.append('MaxOccupancy', formValue.maxOccupancy);
    formData.append('Floor', formValue.floor);
    formData.append('NumberOfBeds', formValue.numberOfBeds);
    formData.append('AcType', formValue.acType);
    formData.append('BathroomType', formValue.bathroomType);
    formData.append('RoomStatus', formValue.roomStatus);
    formData.append('RoomType', formValue.roomType);
    formData.append('IsActive', String(formValue.isActive));
    formData.append('Description', formValue.description || '');
    formData.append('IsTv', String(formValue.isTv));

    // Add createdBy and createdOn for new rooms - though usually handled by backend, 
    // keeping consistent with request if needed, but often better left to backend.
    // However, for FormData, we append what's needed.
    // The previous implementation added them conditionally.
    if (!this.isEditMode) {
      // specific requirements might need these, but usually backend handles auditing.
      // If strict Swagger adherence is required, we might need them. 
      // Based on Swagger screenshot, CreatedBy/On are there but maybe optional or read-only? 
      // I will omit distinct CreatedBy/On unless critical as backend should set them.
      // But I will follow the previous pattern if it was explicit.
      // Actually, let's keep it simple first.
    }

    // Handle Documents (Existing + New)
    let docIndex = 0;

    // 1. Add Existing Documents (that haven't been removed)
    if (this.existingImages.length > 0) {
      for (const existingDoc of this.existingImages) {
        if (existingDoc.documentId) {
          formData.append(`Documents[${docIndex}].documentId`, existingDoc.documentId);
          formData.append(`Documents[${docIndex}].entityType`, existingDoc.entityType || 'Room');
          formData.append(`Documents[${docIndex}].entityId`, existingDoc.entityId || '0');
          formData.append(`Documents[${docIndex}].documentType`, existingDoc.documentType || 'Image');
          formData.append(`Documents[${docIndex}].fileName`, existingDoc.fileName || '');
          formData.append(`Documents[${docIndex}].filePath`, existingDoc.filePath || '');
          formData.append(`Documents[${docIndex}].isPrimary`, String(existingDoc.isPrimary));
        }
        docIndex++;
      }
    }

    // 2. Add New Images
    if (this.uploadedImages.length > 0) {
      for (let i = 0; i < this.uploadedImages.length; i++) {
        const image = this.uploadedImages[i];

        formData.append(`Documents[${docIndex}].filePath`, '');
        formData.append(`Documents[${docIndex}].fileName`, image.name);
        formData.append(`Documents[${docIndex}].documentType`, 'Image');
        formData.append(`Documents[${docIndex}].documentId`, '0');
        const isPrimary = this.existingImages.length === 0 && i === 0;
        formData.append(`Documents[${docIndex}].isPrimary`, isPrimary ? 'true' : 'false');
        formData.append(`Documents[${docIndex}].file`, image.file);
        formData.append(`Documents[${docIndex}].description`, '');
        formData.append(`Documents[${docIndex}].entityType`, 'Room');
        formData.append(`Documents[${docIndex}].entityId`, '0');

        docIndex++;
      }
    }

    return formData;
  }

  private parseImages(imagesJson: string): string[] {
    // Helper not strictly used if we rely on documents, but kept for fallback
    if (!imagesJson) {
      return [];
    }
    try {
      return JSON.parse(imagesJson);
    } catch {
      return imagesJson ? [imagesJson] : [];
    }
  }



  removeExistingImage(index: number): void {
    this.existingImages.splice(index, 1);
  }

  cancel(): void {
    this.router.navigate(['/main/masters/room-master']);
  }
}

