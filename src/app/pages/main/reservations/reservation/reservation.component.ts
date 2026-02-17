import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { LoaderService } from '../../../../core/services/loader.service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.css'
})
export class ReservationComponent implements OnInit {
  reservationForm: FormGroup;
  isLoading: boolean = false;
  roomData: any = null;
  roomId: number | null = null;
  guestImagePreviews: { [key: number]: string } = {};
  guestImageFiles: { [key: number]: File } = {};

  idProofTypes = [
    { value: '', label: 'Select' },
    { value: 'aadhar', label: 'Aadhar' },
    { value: 'pan', label: 'PAN' },
    { value: 'other', label: 'Other' }
  ];

  genders = [
    { value: '', label: 'Select' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private loaderService: LoaderService
  ) {
    // Set today's date as default for check-in
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    this.reservationForm = this.fb.group({
      checkInDate: [todayString, [Validators.required]],
      checkOutDate: ['', [Validators.required]],
      numberOfGuests: ['', [Validators.required]],
      guests: this.fb.array([this.createGuestForm(true)]) // Start with one guest form, set as primary by default
    });
  }

  createGuestForm(isPrimary: boolean = false): FormGroup {
    return this.fb.group({
      guestName: ['', [Validators.required]],
      age: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      guestPhone: ['', [Validators.required]],
      guestEmail: ['', [Validators.email]], // Optional - no required validator
      idProof: ['', [Validators.required]],
      idProofImage: [''],
      isPrimary: [isPrimary]
    });
  }

  get guestsFormArray(): FormArray {
    return this.reservationForm.get('guests') as FormArray;
  }

  ngOnInit(): void {
    // Get room data from route state or params
    this.route.params.subscribe(params => {
      if (params['roomId']) {
        this.roomId = +params['roomId'];
        // Check if room data is in history state
        const state = history.state;
        if (state && state['room']) {
          this.roomData = state['room'];
          this.initializeForm();
        } else if (this.roomId && this.roomId > 0) {
          // Load room data from API if not in state and roomId is valid
          this.loadRoomData(this.roomId);
        } else {
          // If no valid roomId and no state data, redirect back
          alert('Room information not available. Please select a room again.');
          this.router.navigate(['/main/room-booking']);
        }
      }
    });
  }

  loadRoomData(roomId: number): void {
    this.isLoading = true;
    this.loaderService.show();
    this.apiService.getRoomById(roomId).subscribe({
      next: (room: any) => {
        this.roomData = room;
        this.initializeForm();
        this.isLoading = false;
        this.loaderService.hide();
      },
      error: (error: any) => {
        console.error('Error loading room:', error);
        this.isLoading = false;
        this.loaderService.hide();
        alert('Error loading room data. Please try again.');
        this.router.navigate(['/main/room-booking']);
      }
    });
  }

  initializeForm(): void {
    // Form is already initialized in constructor
    // You can pre-fill any fields here if needed
  }

  addGuest(): void {
    this.guestsFormArray.push(this.createGuestForm(false));
  }

  onPrimaryChange(index: number, event: any): void {
    const isChecked = event.target.checked;
    if (isChecked) {
      // Uncheck all other guests
      this.guestsFormArray.controls.forEach((guest, i) => {
        if (i !== index) {
          guest.patchValue({ isPrimary: false }, { emitEvent: false });
        }
      });
    }
  }

  hasPrimaryGuest(): boolean {
    return this.guestsFormArray.controls.some(guest => guest.get('isPrimary')?.value === true);
  }

  removeGuest(index: number): void {
    if (this.guestsFormArray.length > 1) {
      const wasPrimary = this.guestsFormArray.at(index).get('isPrimary')?.value;
      this.guestsFormArray.removeAt(index);
      // Remove associated image preview and file
      delete this.guestImagePreviews[index];
      delete this.guestImageFiles[index];
      // Reindex the remaining images
      this.reindexGuestImages(index);

      // If the removed guest was primary, set the first remaining guest as primary
      if (wasPrimary && this.guestsFormArray.length > 0) {
        this.guestsFormArray.at(0).patchValue({ isPrimary: true });
      }
    }
  }

  reindexGuestImages(removedIndex: number): void {
    const newPreviews: { [key: number]: string } = {};
    const newFiles: { [key: number]: File } = {};

    Object.keys(this.guestImagePreviews).forEach(key => {
      const idx = parseInt(key);
      if (idx > removedIndex) {
        newPreviews[idx - 1] = this.guestImagePreviews[idx];
        newFiles[idx - 1] = this.guestImageFiles[idx];
      } else if (idx < removedIndex) {
        newPreviews[idx] = this.guestImagePreviews[idx];
        newFiles[idx] = this.guestImageFiles[idx];
      }
    });

    this.guestImagePreviews = newPreviews;
    this.guestImageFiles = newFiles;
  }

  onIdImageSelected(event: Event, guestIndex: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (validTypes.includes(file.type)) {
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          alert('Image size should be less than 5MB');
          input.value = '';
          return;
        }

        this.guestImageFiles[guestIndex] = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.guestImagePreviews[guestIndex] = e.target.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select only jpg, jpeg, png, or svg files');
        input.value = '';
      }
    }
  }

  removeIdImage(guestIndex: number): void {
    delete this.guestImagePreviews[guestIndex];
    delete this.guestImageFiles[guestIndex];
    const fileInputs = document.querySelectorAll(`input[type="file"][data-guest-index="${guestIndex}"]`) as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      input.value = '';
    });
  }

  async onSubmit(): Promise<void> {
    // Check if at least one guest is marked as primary
    if (!this.hasPrimaryGuest()) {
      alert('Please select at least one guest as primary.');
      return;
    }

    if (this.reservationForm.valid) {
      this.isLoading = true;
      this.loaderService.show();
      const formData = this.prepareFormData();

      // Call booking API
      this.apiService.createBooking(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.loaderService.hide();
          alert('Reservation submitted successfully!');
          const bookingId = response.bookingId || response.data?.bookingId;
          const roomNumber = this.getRoomNumber();
          this.router.navigate(['/main/room-booking/add-service'], { queryParams: { bookingId: bookingId, roomNumber: roomNumber } });
        },
        error: (error: any) => {
          console.error('Error creating booking:', error);
          this.isLoading = false;
          this.loaderService.hide();
          const errorMessage = error?.error?.message || error?.message || 'Failed to create reservation. Please try again.';
          alert(errorMessage);
        }
      });
    }
  }

  private prepareFormData(): FormData {
    const formData = new FormData();
    const formValue = this.reservationForm.value;

    const roomId = this.roomId || this.roomData?.Id || this.roomData?.id;
    const roomNumber = this.roomData?.roomNumber || this.roomData?.roomnumber;

    formData.append('RoomId', roomId ? roomId.toString() : '0');
    if (roomNumber) formData.append('RoomNumber', roomNumber);
    formData.append('CheckInDate', formValue.checkInDate);
    formData.append('CheckOutDate', formValue.checkOutDate);
    formData.append('NumberOfGuests', formValue.numberOfGuests.toString());

    // Iterate guests
    formValue.guests.forEach((guest: any, index: number) => {
      formData.append(`Guests[${index}].GuestName`, guest.guestName);
      formData.append(`Guests[${index}].Age`, guest.age.toString());
      formData.append(`Guests[${index}].Gender`, guest.gender);
      formData.append(`Guests[${index}].GuestPhone`, guest.guestPhone);
      if (guest.guestEmail) formData.append(`Guests[${index}].GuestEmail`, guest.guestEmail);
      formData.append(`Guests[${index}].IdProof`, guest.idProof);
      formData.append(`Guests[${index}].IsPrimary`, String(guest.isPrimary === true || guest.isPrimary === 'true')); // Convert to string "true"/"false"

      // Handle Document (ID Proof Image)
      // Check if we have a file for this guest
      if (this.guestImageFiles[index]) {
        const file = this.guestImageFiles[index];
        // We are adding one document as per current UI logic (IdProofImage)
        // Index 0 for documents list
        formData.append(`Guests[${index}].Documents[0].DocumentType`, 'ID_PROOF');
        formData.append(`Guests[${index}].Documents[0].EntityType`, 'GUEST');
        formData.append(`Guests[${index}].Documents[0].IsPrimary`, 'true');
        formData.append(`Guests[${index}].Documents[0].FileName`, file.name);
        formData.append(`Guests[${index}].Documents[0].file`, file);
      }
    });

    return formData;
  }



  cancel(): void {
    this.router.navigate(['/main/room-booking']);
  }

  getRoomNumber(): string {
    return this.roomData?.roomNumber || this.roomData?.roomnumber || 'N/A';
  }

  getRoomType(): string {
    return this.roomData?.roomType || this.roomData?.roomtype || this.roomData?.type || 'N/A';
  }

  getPrice(): string {
    const price = this.roomData?.price || this.roomData?.Price || this.roomData?.rate || this.roomData?.Rate || 0;
    return price ? `$${price}` : 'N/A';
  }

  openDatePicker(fieldName: string): void {
    const dateInput = document.getElementById(fieldName) as HTMLInputElement;
    if (dateInput) {
      // Try to use showPicker() if available (modern browsers)
      if (dateInput.showPicker) {
        dateInput.showPicker();
      } else {
        // Fallback: trigger click on the input
        dateInput.focus();
        dateInput.click();
      }
    }
  }
}

