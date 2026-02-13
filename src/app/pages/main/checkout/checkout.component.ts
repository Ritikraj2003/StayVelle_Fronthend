import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  bookingId: number | null = null;
  roomId: number | null = null;
  roomNumber: string | null = null;
  bookingData: any = null;
  isLoading: boolean = false;
  isSaving: boolean = false;
  error: string = '';

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    // Check for roomId and roomNumber parameters
    const params = this.route.snapshot.params;

    if (params['roomId'] && params['roomNumber']) {
      this.roomId = +params['roomId'];
      this.roomNumber = params['roomNumber'];
      this.loadBookingDataByRoom();
    } else if (params['id']) {
      this.bookingId = +params['id'];
      this.loadBookingData();
    } else {
      this.error = 'No booking information provided.';
    }
  }

  loadBookingDataByRoom(): void {
    if (!this.roomId || !this.roomNumber) return;

    this.isLoading = true;
    this.error = '';
    this.loaderService.show();

    this.apiService.getBookingsByRoomIdRoomNumber(this.roomNumber, this.roomId).subscribe({
      next: (data: any) => {
        this.processBookingData(data);
      },
      error: (error: any) => {
        console.error('Error loading booking by room:', error);
        this.error = 'Failed to load booking data. Please try again.';
        this.isLoading = false;
        this.loaderService.hide();
      }
    });
  }

  loadBookingData(): void {
    if (!this.bookingId) return;

    this.isLoading = true;
    this.error = '';
    this.loaderService.show();

    this.apiService.getBookingById(this.bookingId).subscribe({
      next: (data: any) => {
        this.processBookingData(data);
      },
      error: (error: any) => {
        console.error('Error loading booking:', error);
        this.error = 'Failed to load booking data. Please try again.';
        this.isLoading = false;
        this.loaderService.hide();
      }
    });
  }

  processBookingData(data: any): void {
    this.bookingData = data;
    if (data?.bookingId) {
      this.bookingId = data.bookingId;
    }

    // Process guests to extract ID proof image path
    if (this.bookingData.guests && this.bookingData.guests.length > 0) {
      this.bookingData.guests.forEach((guest: any) => {
        if (guest.documents && guest.documents.length > 0) {
          const idProofDoc = guest.documents.find((doc: any) => doc.documentType === 'ID_PROOF') || guest.documents[0];
          if (idProofDoc) {
            guest.idProofImagePath = idProofDoc.filePath;
            // Also try to set idProof text to fileName or description if available
            guest.idProof = idProofDoc.fileName || idProofDoc.documentType;
          }
        }
      });
    }

    this.isLoading = false;
    this.loaderService.hide();
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCurrentDateTime(): string {
    const now = new Date();
    return now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateDays(): number {
    debugger;
    if (!this.bookingData?.checkInDate || !this.bookingData?.checkOutDate) {
      return 0;
    }
    const checkIn = new Date(this.bookingData.checkInDate);
    let checkOut = new Date(this.bookingData.checkOutDate);
    const today = new Date();

    // Normalize dates to start of day for accurate comparison
    checkIn.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    // If checkout date is greater than today, use today's date
    if (checkOut < today) {
      checkOut = new Date(today);
    }

    // Ensure check-out is not before check-in
    if (checkOut < checkIn) {
      checkOut = new Date(checkIn);
    }

    // Calculate difference in days
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  }

  calculateNights(): number {
    debugger;
    const days = this.calculateDays();
    // Nights = days (if check-in and check-out are on different days)
    // For same day checkout, it's still 1 night minimum
    return Math.max(days, 1);
  }

  calculateSubtotal(): number {
    if (!this.bookingData?.room?.price) {
      return 0;
    }
    const nights = this.calculateNights();
    const pricePerNight = Number(this.bookingData.room.price) || 0;
    return pricePerNight * nights;
  }

  calculateTax(): number {
    const subtotal = this.calculateSubtotal();
    // Assuming 18% GST
    return subtotal * 0.18;
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + this.calculateTax();
  }

  getPrimaryGuest(): any {
    if (!this.bookingData?.guests || this.bookingData.guests.length === 0) {
      return null;
    }
    return this.bookingData.guests.find((guest: any) => guest.isPrimary) || this.bookingData.guests[0];
  }

  cancel(): void {
    this.router.navigate(['/main/room-booking']);
  }

  save(): void {
    if (!this.bookingId) {
      this.error = 'Booking ID is required';
      return;
    }

    this.isSaving = true;
    this.error = '';
    this.loaderService.show();

    this.apiService.checkOutBooking(this.bookingId).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.loaderService.hide();
        // Redirect to booking page after successful checkout
        this.router.navigate(['/main/room-booking']);
      },
      error: (error: any) => {
        console.error('Error during checkout:', error);
        this.error = error?.error?.message || 'Failed to process checkout. Please try again.';
        this.isSaving = false;
        this.loaderService.hide();
      }
    });
  }
}

