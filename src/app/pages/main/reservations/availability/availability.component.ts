import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.css'
})
export class AvailabilityComponent implements OnInit {
  searchForm: FormGroup;
  showResults = false;
  selectedRooms: any[] = [];

  // Static data - API calls will be added later
  availableRooms = [
    {
      id: 1,
      roomType: 'Delux Room',
      fromDate: '12 Dec 2025',
      toDate: '12 Dec 2025',
      adultOccupancy: 2,
      childOccupancy: 2,
      price: 2000.00,
      tax: 'Occupancy Tax - 10%',
      taxPercent: 10,
      netAmount: 2100.00,
      roomNumber: '101'
    }
  ];

  roomTypes = [
    { value: '', label: 'Select' },
    { value: 'delux', label: 'Delux Room' },
    { value: 'suite', label: 'Suite' },
    { value: 'standard', label: 'Standard Room' }
  ];

  tenantsOptions = [
    { value: '0-0', label: '0 adults . 0 children' },
    { value: '8-4', label: '8 adults . 4 children' },
    { value: '2-2', label: '2 adults . 2 children' },
    { value: '4-2', label: '4 adults . 2 children' }
  ];

  constructor(private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      roomType: [''],
      tenantsDetails: ['8-4']
    });
  }

  ngOnInit(): void {
    // Static data - API calls will be added later
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      // Static search - API calls will be added later
      this.showResults = true;
      console.log('Search data:', this.searchForm.value);
    }
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

