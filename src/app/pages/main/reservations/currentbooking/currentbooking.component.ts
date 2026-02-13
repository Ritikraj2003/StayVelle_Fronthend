import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
  selectedRooms: any[] = [];

  // Static data - API calls will be added later
  availableRooms: any[] = [];
  allBookings: any[] = []; // Store all bookings for filtering


  roomTypes = [
    { value: '', label: 'Select' },
    { value: 'delux', label: 'Delux Room' },
    { value: 'suite', label: 'Suite' },
    { value: 'standard', label: 'Standard Room' }
  ];



  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
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
      const price = b.room?.price || 0;
      const taxPercent = 10;
      const taxAmount = (price * taxPercent) / 100;

      return {
        id: b.bookingId,
        roomType: b.room?.roomType || 'Unknown',
        fromDate: this.formatDate(checkIn),
        toDate: this.formatDate(checkOut),
        adultOccupancy: b.guests.filter((g: any) => g.age >= 12).length,
        childOccupancy: b.guests.filter((g: any) => g.age < 12).length,
        price: price,
        tax: `Occupancy Tax - ${taxPercent}%`,
        taxPercent: taxPercent,
        netAmount: price + taxAmount,
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



  toggleRoomSelection(room: any): void {
    const index = this.selectedRooms.findIndex(r => r.id === room.id);
    if (index > -1) {
      this.selectedRooms.splice(index, 1);
    } else {
      this.selectedRooms.push(room);
    }
  }

  isRoomSelected(roomId: number): boolean {
    return this.selectedRooms.some(r => r.id === roomId);
  }

  makeReservations(): void {
    if (this.selectedRooms.length > 0) {
      console.log('Making reservations for:', this.selectedRooms);
      // Static action - API calls will be added later
      alert(`Reservation will be made for ${this.selectedRooms.length} room(s)`);
    } else {
      alert('Please select at least one room');
    }
  }
}

