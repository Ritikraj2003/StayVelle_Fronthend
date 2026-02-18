import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-paymentpage',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './paymentpage.component.html',
  styleUrl: './paymentpage.component.css'
})
export class PaymentpageComponent implements OnInit {
  bookingId: number | null = null;
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
    this.loadBookingData();
    const params = this.route.snapshot.params;
    if (params['id']) {
      this.bookingId = +params['id'];
      this.loadBookingData();
    } else {
      // Fallback or handle missing ID
      // For now, we'll just log it or maybe check query params
      this.route.queryParams.subscribe(queryParams => {
        if (queryParams['bookingId']) {
          this.bookingId = +queryParams['bookingId'];
          this.loadBookingData();
        }
      });
    }
  }

  loadBookingData(): void {
    //if (!this.bookingId) return;

    this.isLoading = true;
    this.error = '';
    this.loaderService.show();

    this.apiService.getBookingById(7).subscribe({
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

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }); // e.g., Oct 12
  }

  formatDateWithYear(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }); // e.g., Oct 12, 2023
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
    if (!this.bookingData?.checkInDate || !this.bookingData?.checkOutDate) {
      return 0;
    }
    const checkIn = new Date(this.bookingData.checkInDate);
    let checkOut = new Date(this.bookingData.checkOutDate);
    const today = new Date();

    checkIn.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    if (checkOut < today) {
      checkOut = new Date(today);
    }

    if (checkOut < checkIn) {
      checkOut = new Date(checkIn);
    }

    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  }

  calculateNights(): number {
    const days = this.calculateDays();
    return Math.max(days, 1);
  }

  calculateRoomSubtotal(): number {
    if (!this.bookingData?.room?.price) {
      return 0;
    }
    const nights = this.calculateNights();
    const pricePerNight = Number(this.bookingData.room.price) || 0;
    return pricePerNight * nights;
  }

  calculateTax(): number {
    const subtotal = this.calculateRoomSubtotal();
    return subtotal * 0.18;
  }

  calculateServiceTotal(): number {
    if (!this.bookingData?.bookingServices || this.bookingData.bookingServices.length === 0) {
      return 0;
    }
    return this.bookingData.bookingServices.reduce((total: number, service: any) => {
      // Handle potential duplicate services logic if needed, but assuming backend sends flat list or we process it
      // For now simple sum
      return total + (service.price * service.quantity);
    }, 0);
  }

  calculateTotal(): number {
    return this.calculateRoomSubtotal() + this.calculateTax() + this.calculateServiceTotal();
  }

  calculatePaidAmount(): number {
    // Return 0 for now as we don't have this field in the booking data yet
    // If it becomes available, e.g., this.bookingData.paidAmount, we use that
    return this.bookingData?.paidAmount || 0;
  }

  calculateAmountDue(): number {
    return this.calculateTotal() - this.calculatePaidAmount();
  }

  processBookingData(data: any): void {
    this.bookingData = data;
    // Merge duplicate services logic similar to checkout if needed
    if (this.bookingData.bookingServices && this.bookingData.bookingServices.length > 0) {
      const mergedServices: any[] = [];
      this.bookingData.bookingServices.forEach((service: any) => {
        if (service.serviceStatus === 'Ordered') {
          const existingService = mergedServices.find(
            (s) => s.serviceId === service.serviceId && s.serviceStatus === 'Ordered'
          );
          if (existingService) {
            existingService.quantity += service.quantity;
          } else {
            mergedServices.push({ ...service });
          }
        } else {
          mergedServices.push(service);
        }
      });
      this.bookingData.bookingServices = mergedServices;
    }

    this.isLoading = false;
    this.loaderService.hide();
  }

  processPayment(): void {
    // if (!this.bookingId) {
    //   this.error = 'Booking ID is required';
    //   return;
    // }

    this.isSaving = true;
    this.error = '';
    this.loaderService.show();

    const totalAmount = this.calculateTotal();
    const amountToPay = this.calculateAmountDue();
    const paymentType = amountToPay === totalAmount ? 'Final' : 'Advance';

    const paymentData = {
      bookingId: 7,
      amount: amountToPay,
      paymentMode: 'Cash', // Hardcoded as requested
      paymentStatus: 'Completed', // Assuming completed for now
      paymentType: paymentType,
      referenceNumber: '',
      notes: 'Payment processed via Payment Page'
    };
    debugger
    this.apiService.processPayment(paymentData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.loaderService.hide();
        // Redirect to booking history or show success
        alert(`Payment of ₹${amountToPay} Processed Successfully!`);
        this.router.navigate(['/main/booking-history']);
      },
      error: (error: any) => {
        console.error('Error processing payment:', error);
        this.error = error?.error?.message || 'Failed to process payment. Please try again.';
        this.isSaving = false;
        this.loaderService.hide();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/main/room-booking']);
  }
}
