import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './booking-history.component.html',
  styleUrl: './booking-history.component.css'
})
export class BookingHistoryComponent implements OnInit {
  allBookings: any[] = []; // Store all bookings from API
  filteredBookings: any[] = []; // Store filtered bookings for display
  
  // Filter properties
  filterBookingId: string = '';
  filterGuestName: string = '';
  filterStatus: string = '';
  
  // Active filters array
  activeFilters: Array<{type: string, label: string, value: string}> = [];
  isLoading: boolean = false;

  // View modal properties
  showViewModal: boolean = false;
  selectedBookingData: any = null;
  isLoadingBookingDetails: boolean = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getBookings();
  }

  getBookings(): void {
    this.isLoading = true;
    this.apiService.getBookings().subscribe({
      next: (bookings) => {
        this.allBookings = bookings || [];
        // Initially show all bookings, filters will be applied only on Search button click
        this.filteredBookings = [...this.allBookings];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.allBookings = [];
        this.filteredBookings = [];
        this.isLoading = false;
      }
    });
  }

  viewBooking(data: number): void {
    this.selectedBookingData = data;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedBookingData = null;
  }

  applyFilters(): void {
    let filtered = [...this.allBookings];
    
    // Filter by booking ID
    if (this.filterBookingId && this.filterBookingId.trim() !== '') {
      const idFilter = this.filterBookingId.trim();
      filtered = filtered.filter(booking => 
        (booking.bookingId && booking.bookingId.toString().includes(idFilter)) ||
        (booking.id && booking.id.toString().includes(idFilter))
      );
    }
    
    // Filter by guest name
    if (this.filterGuestName && this.filterGuestName.trim() !== '') {
      const nameFilter = this.filterGuestName.toLowerCase().trim();
      filtered = filtered.filter(booking => {
        if (booking.guests && booking.guests.length > 0) {
          return booking.guests.some((guest: any) => 
            (guest.guestName && guest.guestName.toLowerCase().includes(nameFilter)) ||
            (guest.guestPhone && guest.guestPhone.includes(nameFilter))
          );
        }
        return false;
      });
    }
    
    // Filter by status
    if (this.filterStatus && this.filterStatus !== 'Select' && this.filterStatus !== '') {
      filtered = filtered.filter(booking => {
        const bookingStatus = booking.bookingStatus || booking.status || '';
        return bookingStatus === this.filterStatus;
      });
    }
    
    this.filteredBookings = filtered;
  }

  onSearch(): void {
    // Clear previous filters
    this.activeFilters = [];
    
    // Add active filters based on selected values
    if (this.filterBookingId && this.filterBookingId.trim() !== '') {
      this.activeFilters.push({
        type: 'bookingId',
        label: this.filterBookingId,
        value: this.filterBookingId
      });
    }
    
    if (this.filterGuestName && this.filterGuestName.trim() !== '') {
      this.activeFilters.push({
        type: 'guestName',
        label: this.filterGuestName,
        value: this.filterGuestName
      });
    }
    
    if (this.filterStatus && this.filterStatus !== 'Select' && this.filterStatus !== '') {
      this.activeFilters.push({
        type: 'status',
        label: this.filterStatus,
        value: this.filterStatus
      });
    }
    
    // Apply filters to the data
    this.applyFilters();
  }

  removeFilter(filterType: string): void {
    // Clear the corresponding form field
    if (filterType === 'bookingId') {
      this.filterBookingId = '';
    } else if (filterType === 'guestName') {
      this.filterGuestName = '';
    } else if (filterType === 'status') {
      this.filterStatus = '';
    }
    
    // Re-apply search with remaining filters (this will update activeFilters)
    this.onSearch();
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  }

  getPrimaryGuest(booking: any): any {
    if (!booking?.guests || booking.guests.length === 0) {
      return null;
    }
    return booking.guests.find((guest: any) => guest.isPrimary) || booking.guests[0];
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    return status.replace(/\s+/g, '');
  }

  // Calculation methods for booking details
  calculateDays(): number {
    if (!this.selectedBookingData?.checkInDate || !this.selectedBookingData?.checkOutDate) {
      return 0;
    }
    const checkIn = new Date(this.selectedBookingData.checkInDate);
    let checkOut = new Date(this.selectedBookingData.checkOutDate);
    const today = new Date();
    
    // Normalize dates to start of day for accurate comparison
    checkIn.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);
    
    // If checkout date is greater than today, use today's date
    if (checkOut > today) {
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
    const days = this.calculateDays();
    // Nights = days (if check-in and check-out are on different days)
    // For same day checkout, it's still 1 night minimum
    return Math.max(days, 1);
  }

  calculateSubtotal(): number {
    if (!this.selectedBookingData?.room?.price) {
      return 0;
    }
    const nights = this.calculateNights();
    const pricePerNight = Number(this.selectedBookingData.room.price) || 0;
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

  getPrimaryGuestForModal(): any {
    if (!this.selectedBookingData?.guests || this.selectedBookingData.guests.length === 0) {
      return null;
    }
    return this.selectedBookingData.guests.find((guest: any) => guest.isPrimary) || this.selectedBookingData.guests[0];
  }

  formatDateTime(dateString: string | null): string {
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
}

