import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './currentbooking.component.html',
  styleUrl: './currentbooking.component.css'
})
export class CurrentBookingComponent implements OnInit {
  searchForm: FormGroup;
  showResults = false;

  availableRooms: any[] = [];
  allBookings: any[] = [];


  roomTypes = [
    { value: '', label: 'Select' },
    { value: 'delux', label: 'Delux Room' },
    { value: 'suite', label: 'Suite' },
    { value: 'standard', label: 'Standard Room' }
  ];



  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      roomType: [''],
      roomNumber: ['']
    });
  }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.apiService.getBookings().subscribe({
      next: (res: any) => {
        let bookings = Array.isArray(res) ? res : (res.data || []);

        // Filter for "Booked" status
        this.allBookings = bookings.filter((b: any) => b.bookingStatus === 'Booked');

        this.applyFilter();
      },
      error: (err: any) => {
        console.error('Error fetching bookings', err);
      }
    });
  }

  onSearch(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    const filters = this.searchForm.value;
    let filtered = this.allBookings;

    // Filter by Room Type
    if (filters.roomType) {
      filtered = filtered.filter((b: any) => b.room?.roomType === filters.roomType);
    }

    // Filter by Room Number
    if (filters.roomNumber) {
      const searchNum = filters.roomNumber.toLowerCase();
      filtered = filtered.filter((b: any) => b.roomNumber?.toLowerCase().includes(searchNum));
    }

    // Filter by Date Range
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      // Show if booking checks out AFTER fromDate
      filtered = filtered.filter((b: any) => new Date(b.checkOutDate) >= from);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      // Show if booking checks in BEFORE toDate
      filtered = filtered.filter((b: any) => new Date(b.checkInDate) <= to);
    }

    this.availableRooms = filtered.map((b: any) => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);

      // Nights calculation (min 1)
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const nights = Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24)), 1);

      const pricePerNight = Number(b.room?.price) || 0;
      const baseOccupancy = Number(b.room?.baseOccupancy) || 0;
      const extraAdultRate = Number(b.room?.extraAdultCharge) || 0;

      // Count only guests with guestType === 'Adult'
      const adultCount = (b.guests || []).filter((g: any) => g.guestType === 'Adult').length;
      const childCount = (b.guests || []).filter((g: any) => g.guestType !== 'Adult').length;

      // Room amount = price per night × nights
      const roomAmount = pricePerNight * nights;

      // Extra adult charge: adults beyond baseOccupancy × rate × nights
      const extraAdults = Math.max(adultCount - baseOccupancy, 0);
      const extraAdultCharge = extraAdults * extraAdultRate * nights;

      // Service total
      const serviceTotal = (b.bookingServices || []).reduce((sum: number, s: any) => {
        return sum + (Number(s.price) * Number(s.quantity));
      }, 0);

      // Net = room amount + extra adult charge + services
      const netAmount = roomAmount + extraAdultCharge + serviceTotal;

      return {
        id: b.bookingId,
        roomType: b.room?.roomType || 'Unknown',
        fromDate: this.formatDate(checkIn),
        toDate: this.formatDate(checkOut),
        nights,
        adultOccupancy: adultCount,
        childOccupancy: childCount,
        infantsOccupancy: (b.guests || []).filter((g: any) => g.guestType === 'Infant').length,
        pricePerNight,
        roomAmount,
        extraAdults,
        extraAdultCharge,
        serviceTotal,
        netAmount,
        roomNumber: b.roomNumber,
        originalBooking: b
      };
    });
    this.showResults = true;
  }

  private formatDate(date: Date): string {
    // Format: 12 Dec 2025
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }



  payNow(bookingId: number): void {
    this.router.navigate(['/main/paymentpage', bookingId]);
  }
}

