import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-view-bill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-bill.component.html',
  styleUrl: './view-bill.component.css'
})
export class ViewBillComponent implements OnInit {
  @Input() bookingData: any;

  constructor(
    private apiService: ApiService,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
    if (this.bookingData?.bookingId) {
      this.getBookingByBookingId(this.bookingData.bookingId);
    }
  }

  getBookingByBookingId(id: number) {
    this.apiService.getBookingByBookingId(id).subscribe((res: any) => {
      this.bookingData = res;
    });
  }

  get primaryGuest(): any {
    return this.bookingData?.guests?.find((g: any) => g.isPrimary) || this.bookingData?.guests?.[0];
  }

  /** Merges bookingServices with same serviceId by summing quantity */
  get mergedServices(): any[] {
    const services: any[] = this.bookingData?.bookingServices || [];
    const map = new Map<number, any>();
    for (const s of services) {
      if (map.has(s.serviceId)) {
        map.get(s.serviceId).quantity += (s.quantity || 1);
      } else {
        map.set(s.serviceId, { ...s });
      }
    }
    return Array.from(map.values());
  }

  /** Calculates nights from actual check-in to actual check-out (each 24h = 1 night) */
  calculateNights(): number {
    const inTime = this.bookingData?.actualCheckInTime;
    const outTime = this.bookingData?.actualCheckOutTime;
    if (!inTime || !outTime) {
      // Fallback to scheduled dates if actual times are not available
      const checkIn = this.bookingData?.checkInDate;
      const checkOut = this.bookingData?.checkOutDate;
      if (!checkIn || !checkOut) return 1;
      const diff = Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(diff, 1);
    }
    const diffMs = new Date(outTime).getTime() - new Date(inTime).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(Math.ceil(diffHours / 24), 1);
  }

  getRoomBasePrice(): number {
    return (this.bookingData?.room?.price || 0) * this.calculateNights();
  }

  getServiceAmount(service: any): number {
    return (service.price || 0) * (service.quantity || 1);
  }

  calculateSubTotal(): number {
    const roomBase = this.getRoomBasePrice();
    const servicesBase = this.mergedServices.reduce((sum: number, s: any) => sum + this.getServiceAmount(s), 0);
    return roomBase + servicesBase;
  }

  calculateTax(): number {
    return this.getRoomBasePrice() * 0.18;
  }

  calculateTotal(): number {
    return this.calculateSubTotal() + this.calculateTax();
  }

  calculatePaidAmount(): number {
    return (this.bookingData?.payments || [])
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  }

  calculateBalance(): number {
    return Math.max(this.calculateTotal() - this.calculatePaidAmount(), 0);
  }

  get isPaid(): boolean {
    return this.calculateBalance() === 0;
  }

  getPaymentMode(): string {
    if (!this.bookingData?.payments || this.bookingData.payments.length === 0) return 'N/A';
    return this.bookingData.payments[this.bookingData.payments.length - 1]?.paymentMode || 'N/A';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  formatDateTime(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  numberToWords(num: number): string {
    if (isNaN(num) || num <= 0) return 'Zero only';
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
      'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
      'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const n = Math.floor(num);
    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
    };
    const words = inWords(n);
    return words.charAt(0).toUpperCase() + words.slice(1) + ' only';
  }

  print(): void {
    window.print();
  }

  cancel(): void {
    this.activeModal.dismiss('close');
  }
}
