import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';


@Component({
  selector: 'app-room-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './room-booking.component.html',
  styleUrl: './room-booking.component.css'
})
export class RoomBookingComponent implements OnInit {
  filterForm: FormGroup;
  
  roomTypes = [
    { value: '', label: 'Select' },
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'suite', label: 'Suite' },
    { value: 'deluxe', label: 'Deluxe' }
  ];

  allRooms: any[] = [];
  filteredRooms: any[] = [];
  isLoading: boolean = false;
  floors: string[] = [];
  
  // Active filters array
  activeFilters: Array<{type: string, label: string, value: string}> = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      roomType: [''],
      floor: ['']
    });
  }

  ngOnInit(): void {
    // Load rooms from API
    this.getRooms();
  }

  getRooms(): void {
    this.isLoading = true;
    this.apiService.getRooms().subscribe({
      next: (rooms: any) => {
        this.allRooms = rooms || [];
        // Initially show all rooms
        this.filteredRooms = [...this.allRooms];
        // Extract unique floors from rooms
        this.extractFloors();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading rooms:', error);
        this.allRooms = [];
        this.filteredRooms = [];
        this.isLoading = false;
        alert('Failed to load rooms. Please try again.');
      }
    });
  }

  extractFloors(): void {
    const floorSet = new Set<string>();
    this.allRooms.forEach(room => {
      const floor = room.floor || room.Floor || room.floorNumber || room.floor_number;
      if (floor !== null && floor !== undefined && floor !== '') {
        floorSet.add(String(floor));
      }
    });
    this.floors = Array.from(floorSet).sort((a, b) => {
      // Sort numerically if possible, otherwise alphabetically
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }

  applyFilters(): void {
    let filtered = [...this.allRooms];
    const { fromDate, toDate, roomType, floor } = this.filterForm.value;
    
    // Filter by room type if selected
    if (roomType && roomType !== 'Select' && roomType !== '') {
      filtered = filtered.filter(room => {
        // Check various possible property names for room type
        const roomTypeValue = room.roomType || room.roomtype || room.type || '';
        return roomTypeValue.toLowerCase() === roomType.toLowerCase();
      });
    }
    
    // Filter by floor if selected
    if (floor && floor !== 'Select' && floor !== '') {
      filtered = filtered.filter(room => {
        // Check various possible property names for floor
        const floorValue = room.floor || room.Floor || room.floorNumber || room.floor_number;
        return String(floorValue) === String(floor);
      });
    }
    
    // Date filtering can be added here when needed
    // This would require room data to have availability/booking dates
    
    this.filteredRooms = filtered;
  }

  onSearch(): void {
    // Clear previous filters
    this.activeFilters = [];
    
    const { fromDate, toDate, roomType, floor } = this.filterForm.value;
    
    // Add active filters based on selected values
    if (fromDate) {
      this.activeFilters.push({
        type: 'fromDate',
        label: `From: ${this.formatDate(fromDate)}`,
        value: fromDate
      });
    }
    
    if (toDate) {
      this.activeFilters.push({
        type: 'toDate',
        label: `To: ${this.formatDate(toDate)}`,
        value: toDate
      });
    }
    
    if (roomType && roomType !== 'Select' && roomType !== '') {
      this.activeFilters.push({
        type: 'roomType',
        label: roomType,
        value: roomType
      });
    }
    
    if (floor && floor !== 'Select' && floor !== '') {
      this.activeFilters.push({
        type: 'floor',
        label: `Floor: ${floor}`,
        value: floor
      });
    }
    
    // Apply filters to the data
    this.applyFilters();
  }

  removeFilter(filterType: string): void {
    // Clear the corresponding form field
    if (filterType === 'fromDate') {
      this.filterForm.patchValue({ fromDate: '' });
    } else if (filterType === 'toDate') {
      this.filterForm.patchValue({ toDate: '' });
    } else if (filterType === 'roomType') {
      this.filterForm.patchValue({ roomType: '' });
    } else if (filterType === 'floor') {
      this.filterForm.patchValue({ floor: '' });
    }
    
    // Re-apply search with remaining filters
    this.onSearch();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getRoomType(room: any): string {
    return room.roomType || room.roomtype || room.type || 'N/A';
  }

  getRoomStatus(room: any): string {
    const status = room.roomStatus || room.roomstatus || room.status || room.Status || '';
    if (!status) return 'N/A';
    return status.toUpperCase();
  }

  isRoomAvailable(room: any): boolean {
    const status = room.roomStatus || room.roomstatus || room.status || room.Status || '';
    return status && status.toLowerCase() === 'available';
  }

  isRoomOccupied(room: any): boolean {
    const status = room.roomStatus || room.roomstatus || room.status || room.Status || '';
    return status && status.toLowerCase() === 'occupied';
  }

  onRoomClick(room: any): void {
    // Check if room is available
    if (this.isRoomAvailable(room)) {
      const roomId = room.Id || room.id || room.roomId;
      if (roomId) {
        // Navigate with room data via state
        this.router.navigate(['/main/reservations/reservation', roomId], {
          state: { room: room }
        });
      } else {
        // If no ID, still navigate but pass room data via state
        this.router.navigate(['/main/reservations/reservation', 0], {
          state: { room: room }
        });
      }
    } else if (this.isRoomOccupied(room)) {
      // Show alert for occupied rooms
      alert('This room is already occupied. Please select an available room.');
    } else {
      // For other statuses, show a message
      alert('This room is not available for booking at the moment.');
    }
  }
}

