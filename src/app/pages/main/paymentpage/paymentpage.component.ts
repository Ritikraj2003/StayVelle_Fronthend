import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../core/services/api.service';
import { LoaderService } from '../../../core/services/loader.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ViewBillComponent } from '../view-bill/view-bill.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-paymentpage',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './paymentpage.component.html',
  styleUrl: './paymentpage.component.css'
})
export class PaymentpageComponent implements OnInit {
  bookingId: number | null = null;
  bookingData: any = null;
  paidAmount: number = 0;
  isLoading: boolean = false;
  isSaving: boolean = false;
  error: string = '';

  // Amount tracking
  baseAmountDue: number = 0;
  editedAmountDue: number | null = null;

  // Payment Modal variables
  showPaymentModal: boolean = false;
  selectedPaymentMethod: 'Razorpay' | 'Cash' = 'Razorpay';
  amountReceived: number = 0;
  paymentNotes: string = '';

  @ViewChild('paymentModalContent') paymentModalContent!: TemplateRef<any>;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private loaderService: LoaderService,
    private modalService: NgbModal,
    private notification: NotificationService
  ) { }

  ngOnInit(): void {
    const params = this.route.snapshot.params;
    // Support both /paymentpage/:bookingId (route param) and ?bookingId= (query param)
    if (params['bookingId']) {
      this.bookingId = +params['bookingId'];
      this.loadAllData();
    } else if (params['id']) {
      this.bookingId = +params['id'];
      this.loadAllData();
    } else {
      this.route.queryParams.subscribe(queryParams => {
        if (queryParams['bookingId']) {
          this.bookingId = +queryParams['bookingId'];
          this.loadAllData();
        }
      });
    }
  }

  /** Calls both booking API and payments API in parallel; keeps loader until both respond */
  loadAllData(): void {
    if (!this.bookingId) return;

    this.isLoading = true;
    this.error = '';
    this.loaderService.show();

    forkJoin({
      booking: this.apiService.getBookingById(this.bookingId),
      payments: this.apiService.getPaymentsByBookingId(this.bookingId).pipe(
        catchError(() => of([]))   // if payment history fails, treat as empty
      )
    }).subscribe({
      next: ({ booking, payments }) => {
        this.processBookingData(booking);
        // Sum all previously completed payments
        this.paidAmount = (payments || []).reduce(
          (sum: number, p: any) => sum + (Number(p.amount) || 0), 0
        );
        this.baseAmountDue = Math.max(this.calculateTotal() - this.paidAmount, 0);
        this.editedAmountDue = this.baseAmountDue;
        this.isLoading = false;
        this.loaderService.hide();
      },
      error: (error: any) => {
        console.error('Error loading payment page data:', error);
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
    const baseOccupancy = Number(this.bookingData.room.baseOccupancy) || 0;
    const extraAdultCharge = Number(this.bookingData.room.extraAdultCharge) || 0;
    const numberOfGuests = Number(this.bookingData.numberOfGuests) || 0;
    const extraGuests = Math.max(numberOfGuests - baseOccupancy, 0);
    const pricePerNightWithExtras = pricePerNight + (extraGuests * extraAdultCharge);
    return pricePerNightWithExtras * nights;
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
      return total + (service.price * service.quantity);
    }, 0);
  }

  calculateTotal(): number {
    return this.calculateRoomSubtotal() + this.calculateTax() + this.calculateServiceTotal();
  }

  calculatePaidAmount(): number {
    return this.paidAmount;
  }

  onAmountEdit(): void {
    if (this.editedAmountDue !== null && this.editedAmountDue > this.baseAmountDue) {
      this.editedAmountDue = this.baseAmountDue;
    }
    // Also prevent negative amounts
    if (this.editedAmountDue !== null && this.editedAmountDue < 0) {
      this.editedAmountDue = 0;
    }
  }

  calculateAmountDue(): number {
    if (this.editedAmountDue !== null) {
      return this.editedAmountDue;
    }
    return Math.max(this.calculateTotal() - this.paidAmount, 0);
  }

  isAmountFull(): boolean {
    const calculatedDue = Math.max(this.calculateTotal() - this.paidAmount, 0);
    return Math.abs((this.editedAmountDue || 0) - calculatedDue) < 0.01;
  }

  processBookingData(data: any): void {
    this.bookingData = data;
    // Merge duplicate services
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
  }

  openPaymentModal(): void {
    this.amountReceived = this.calculateAmountDue();
    this.selectedPaymentMethod = 'Razorpay';
    this.paymentNotes = '';
    this.modalService.open(this.paymentModalContent, { size: 'lg', centered: true, backdrop: 'static', modalDialogClass: 'custom-payment-dialog' });
  }

  closePaymentModal(): void {
    this.modalService.dismissAll();
  }

  isCheckoutProcessing: boolean = false;

  processPayment(isCheckout: boolean = false): void {
    this.isSaving = true;
    this.isCheckoutProcessing = isCheckout;
    this.error = '';
    this.loaderService.show();

    const totalAmount = this.calculateTotal();
    const amountToPay = this.selectedPaymentMethod === 'Cash' ? this.amountReceived : this.calculateAmountDue();
    const paymentType = amountToPay >= this.calculateAmountDue() ? 'Final' : 'Advance';

    const paymentData = {
      bookingId: this.bookingId,
      amount: amountToPay,
      paymentMode: this.selectedPaymentMethod === 'Cash' ? 'Cash' : 'Online',
      paymentStatus: 'Completed',
      paymentType: paymentType,
      referenceNumber: '',
      notes: this.selectedPaymentMethod === 'Cash' ? this.paymentNotes : 'Payment processed via Razorpay'
    };

    this.apiService.processPayment(paymentData).subscribe({
      next: (response: any) => {
        if (isCheckout) {
          // If checkOut is requested, call the checkout API
          this.apiService.checkOutBooking(this.bookingId!).subscribe({
            next: () => {
              this.isSaving = false;
              this.isCheckoutProcessing = false;
              this.loaderService.hide();
              this.closePaymentModal();
              this.notification.success(`Payment of ₹${amountToPay} and Check Out Processed Successfully!`);
              // Redirect to Room Booking after checkout success (requested by user)
              this.openBillModal('/main/room-booking');
            },
            error: (checkoutError: any) => {
              console.error('Error during checkout after payment:', checkoutError);
              this.error = checkoutError?.error?.message || 'Payment succeeded, but failed to process checkout. Please try again or checkout later.';
              this.isSaving = false;
              this.isCheckoutProcessing = false;
              this.loaderService.hide();
            }
          });
        } else {
          // Regular payment processing without checkout
          this.isSaving = false;
          this.isCheckoutProcessing = false;
          this.loaderService.hide();
          this.closePaymentModal();
          this.notification.success(`Payment of ₹${amountToPay} Processed Successfully!`);
          // Redirect to Current Booking (requested by user)
          this.router.navigate(['/main/reservations/current-booking']);
        }
      },
      error: (error: any) => {
        console.error('Error processing payment:', error);
        this.error = error?.error?.message || 'Failed to process payment. Please try again.';
        this.isSaving = false;
        this.isCheckoutProcessing = false;
        this.loaderService.hide();
      }
    });
  }

  checkout(): void {
    if (!this.bookingId) return;

    this.isSaving = true;
    this.error = '';
    this.loaderService.show();

    this.apiService.checkOutBooking(this.bookingId).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.loaderService.hide();
        this.notification.success('Check Out Processed Successfully!');
        // Default checkout from button goes to room-booking as it implies guest left and room should be available
        this.openBillModal('/main/room-booking');
      },
      error: (error: any) => {
        console.error('Error during checkout:', error);
        this.error = error?.error?.message || 'Failed to process checkout. Please try again.';
        this.isSaving = false;
        this.loaderService.hide();
      }
    });
  }

  openBillModal(redirectPath: string = '/main/booking-history'): void {
    const modalRef = this.modalService.open(ViewBillComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.bookingData = this.bookingData;

    modalRef.result.then(() => {
      this.router.navigate([redirectPath]);
    }).catch(() => {
      this.router.navigate([redirectPath]);
    });
  }

  cancel(): void {
    this.router.navigate(['/main/reservations/current-booking']);
  }
}

