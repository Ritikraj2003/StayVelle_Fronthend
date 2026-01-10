import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { MaintenanceTask } from '../../../models/maintenance-task.model';
import { LoaderService } from '../../../core/services/loader.service';


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
  allBookings: any[] = [];
  isLoading: boolean = false;
  floors: string[] = [];
  HousekeepingTask: any = null;

  // Active filters array
  activeFilters: Array<{ type: string, label: string, value: string }> = [];

  // Maintenance modal properties
  maintenanceForm: FormGroup;
  staffList: any[] = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Mike Johnson' },
    { id: 4, name: 'Sarah Williams' },
    { id: 5, name: 'David Brown' }
  ];
  selectedRoom: any = null;
  showMaintenanceModal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private loaderService: LoaderService
  ) {
    this.filterForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      roomType: [''],
      floor: ['']
    });

    this.maintenanceForm = this.fb.group({
      taskId: [''],
      bookingId: [''],
      roomId: ['', [Validators.required]],
      taskStatus: ['', [Validators.required]],
      taskType: ['', [Validators.required]],
      assignedToUserId: ['']
    });
  }

  ngOnInit(): void {
    this.getRooms();
    this.getBookings();
  }

  getBookings(): void {
    this.apiService.getBookings().subscribe({
      next: (bookings: any) => {
        this.allBookings = bookings || [];
      },
      error: (error: any) => {
        console.error('Error loading bookings:', error);
        this.allBookings = [];
      }
    });
  }

  getRooms(): void {
    this.isLoading = true;
    this.loaderService.show();
    this.apiService.getRooms().subscribe({
      next: (rooms: any) => {
        this.allRooms = rooms || [];
        this.filteredRooms = [...this.allRooms];
        this.extractFloors();
        this.isLoading = false;
        this.loaderService.hide();
      },
      error: (error: any) => {
        console.error('Error loading rooms:', error);
        this.allRooms = [];
        this.filteredRooms = [];
        this.isLoading = false;
        this.loaderService.hide();
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
    const { roomType, floor } = this.filterForm.value;

    if (roomType && roomType !== 'Select' && roomType !== '') {
      filtered = filtered.filter(room => {
        const roomTypeValue = room.roomType || room.roomtype || room.type || '';
        return roomTypeValue.toLowerCase() === roomType.toLowerCase();
      });
    }

    if (floor && floor !== 'Select' && floor !== '') {
      filtered = filtered.filter(room => {
        const floorValue = room.floor || room.Floor || room.floorNumber || room.floor_number;
        return String(floorValue) === String(floor);
      });
    }

    this.filteredRooms = filtered;
  }

  onSearch(): void {
    this.activeFilters = [];
    const { fromDate, toDate, roomType, floor } = this.filterForm.value;

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

    this.applyFilters();
  }

  removeFilter(filterType: string): void {
    const fieldMap: { [key: string]: string } = {
      'fromDate': 'fromDate',
      'toDate': 'toDate',
      'roomType': 'roomType',
      'floor': 'floor'
    };

    const fieldName = fieldMap[filterType];
    if (fieldName) {
      this.filterForm.patchValue({ [fieldName]: '' });
    }

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

  isRoomMaintenance(room: any): boolean {
    const status = room.roomStatus || room.roomstatus || room.status || room.Status || '';
    return status && status.toLowerCase() === 'maintenance';
  }

  openMaintenanceModal(room: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (room.id !== null) {
      // Use stored bookings data
      const activeBooking = this.allBookings.find((booking: any) => {
        const bookingRoomId = booking.roomId || booking.RoomId;
        const isActive = booking.bookingStatus == 'CheckedOut' &&
          booking.bookingStatus !== 'Cancelled';
        return bookingRoomId === room.id && isActive;
      });

      if (activeBooking?.bookingId) {
        const bookingId = activeBooking.bookingId;
        this.loaderService.show();
        this.apiService.getHousekeepingTaskByBookingId(bookingId).subscribe({
          next: (taskData: any) => {
            console.log('API Response Data (raw):', taskData);
            // Handle if response is wrapped in data property or is an array
            const data = Array.isArray(taskData) ? taskData[0] : (taskData?.data || taskData);
            if (!data) {
              console.warn('No task data found in API response');
              this.loaderService.hide();
              return;
            }
            // Store the task data (could be single object or array)
            this.HousekeepingTask = Array.isArray(taskData) ? taskData : data;
            this.showMaintenanceModal = true;
            
            this.maintenanceForm.patchValue({
              taskId: data.taskId || '',
              roomId: data.roomId || room.id || '',
              bookingId: data.bookingId || bookingId || '',
              taskStatus: data.taskStatus ? String(data.taskStatus).trim() : '',
              taskType: data.taskType ? String(data.taskType).trim() : '',
              assignedToUserId: data.assignedToUserId || ''
            });
            this.loaderService.hide();
          },
          error: (error: any) => {
            console.error('Error fetching housekeeping task:', error);
            this.loaderService.hide();
          }
        });
      }
    }
  }

  closeMaintenanceModal(): void {
    this.showMaintenanceModal = false;
    this.selectedRoom = null;
    this.maintenanceForm.reset();
  }

  onSubmitMaintenance(): void {
    console.log('Form submitted');
    console.log('Form valid:', this.maintenanceForm.valid);
    console.log('Form errors:', this.maintenanceForm.errors);
    console.log('Form value:', this.maintenanceForm.value);
    
    // Mark all fields as touched to show validation errors
    Object.keys(this.maintenanceForm.controls).forEach(key => {
      const control = this.maintenanceForm.get(key);
      control?.markAsTouched();
      if (control?.errors) {
        console.log(`Field ${key} has errors:`, control.errors);
      }
    });
    
    const formData = this.maintenanceForm.value;
    
    // Check if taskId is present (required for update)
    if (!formData.taskId) {
      alert('Task ID is required. Please close and reopen the maintenance modal.');
      return;
    }

    // Console all the data
    console.log('Form Data:', formData);
    console.log('Selected Room:', this.selectedRoom);
    console.log('All Form Values:', {
      bookingId: formData.bookingId,
      roomId: formData.roomId,
      taskStatus: formData.taskStatus,
      taskType: formData.taskType,
      assignedToUserId: formData.assignedToUserId,
      taskId: formData.taskId
    });

    const taskId = formData.taskId;

    // Get existing task data for reference
    const existingTask = Array.isArray(this.HousekeepingTask) ? this.HousekeepingTask[0] : this.HousekeepingTask;
    
    // Prepare update data - use form values or existing values
    const updateData: any = {};
    
    // Only include fields that have values
    if (formData.assignedToUserId) {
      updateData.assignedToUserId = Number(formData.assignedToUserId);
    }
    if (formData.taskStatus) {
      updateData.taskStatus = formData.taskStatus;
    }
    if (formData.taskType) {
      updateData.taskType = formData.taskType;
    }
    if (formData.roomId) {
      updateData.roomId = Number(formData.roomId);
    }
    if (formData.bookingId) {
      updateData.bookingId = Number(formData.bookingId);
    }
    if (existingTask?.roomImage) {
      updateData.roomImage = existingTask.roomImage;
    }

    console.log('Updating task with ID:', taskId);
    console.log('Update data:', updateData);

    // Ensure taskId is a number
    const taskIdNumber = Number(taskId);
    if (isNaN(taskIdNumber)) {
      alert('Invalid Task ID. Cannot update task.');
      console.error('Task ID is not a valid number:', taskId);
      return;
    }

    console.log('Calling API service with taskId:', taskIdNumber, 'and data:', updateData);
    
    try {
      this.loaderService.show();
      const apiCall = this.apiService.updateHousekeepingTask(taskIdNumber, updateData);
      console.log('API call observable created:', apiCall);
      
      apiCall.subscribe({
        next: (response: any) => {
          console.log('Update response received:', response);
          alert('Maintenance task updated successfully!');
          this.closeMaintenanceModal();
          this.getRooms();
          this.loaderService.hide();
        },
        error: (error: any) => {
          console.error('Error updating maintenance task:', error);
          console.error('Error status:', error.status);
          console.error('Error details:', error.error);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          alert('Failed to update maintenance task: ' + (error.error?.message || error.message || 'Unknown error'));
          this.loaderService.hide();
        },
        complete: () => {
          console.log('API call completed');
        }
      });
    } catch (error) {
      console.error('Exception while calling API:', error);
      alert('Failed to call update API. Please check console for details.');
      this.loaderService.hide();
    }
  }

  onRoomClick(room: any): void {
    if (this.isRoomMaintenance(room)) {
      this.openMaintenanceModal(room);
      return;
    }

    if (this.isRoomAvailable(room)) {
      const roomId = room.Id || room.id || room.roomId || 0;
      this.router.navigate(['/main/reservations/reservation', roomId], {
        state: { room: room }
      });
      return;
    }

    if (this.isRoomOccupied(room)) {
      this.navigateToCheckout(room);
      return;
    }

    alert('This room is not available for booking at the moment.');
  }

  navigateToCheckout(room: any): void {
    const roomId = room.Id || room.id || room.roomId;
    if (!roomId) {
      alert('Room ID not found. Cannot proceed to checkout.');
      return;
    }

    // Use stored bookings data
    const activeBooking = this.allBookings.find((booking: any) => {
      const bookingRoomId = booking.roomId || booking.RoomId;
      const isActive = booking.bookingStatus !== 'CheckedOut' &&
        booking.bookingStatus !== 'Cancelled';
      return bookingRoomId === roomId && isActive;
    });

    if (activeBooking?.bookingId) {
      this.router.navigate(['/main/checkout', activeBooking.bookingId]);
      return;
    }

    const anyBooking = this.allBookings.find((booking: any) => {
      const bookingRoomId = booking.roomId || booking.RoomId;
      return bookingRoomId === roomId;
    });

    if (anyBooking?.bookingId) {
      this.router.navigate(['/main/checkout', anyBooking.bookingId]);
    } else {
      alert('No booking found for this room. Cannot proceed to checkout.');
    }
  }
}

