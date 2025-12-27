import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-room-master',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './room-master.component.html',
  styleUrl: './room-master.component.css'
})
export class RoomMasterComponent implements OnInit {
  allRooms: any[] = []; // Store all rooms from API
  filteredRooms: any[] = []; // Store filtered rooms for display
  isLoading: boolean = false;
  
  // Filter properties
  filterName: string = '';
  filterStatus: string = '';
  
  // Active filters array
  activeFilters: Array<{type: string, label: string, value: string}> = [];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load rooms data
    this.getRooms();
  }

  getRooms(): void {
    this.isLoading = true;
    this.apiService.getRooms().subscribe({
      next: (rooms) => {
        this.allRooms = rooms;
        this.filteredRooms = [...this.allRooms];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        this.isLoading = false;
        alert('Failed to load rooms. Please try again.');
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allRooms];
    
    // Filter by room number or description
    if (this.filterName && this.filterName.trim() !== '') {
      const nameFilter = this.filterName.toLowerCase().trim();
      filtered = filtered.filter(room => 
        (room.roomNumber && room.roomNumber.toLowerCase().includes(nameFilter)) ||
        (room.description && room.description.toLowerCase().includes(nameFilter))
      );
    }
    
    // Filter by status
    if (this.filterStatus && this.filterStatus !== 'Select' && this.filterStatus !== '') {
      const isActive = this.filterStatus === 'Active';
      filtered = filtered.filter(room => {
        return room.isActive === isActive;
      });
    }
    
    this.filteredRooms = filtered;
  }

  onSearch(): void {
    // Clear previous filters
    this.activeFilters = [];
    
    // Add active filters based on selected values
    if (this.filterName && this.filterName.trim() !== '') {
      this.activeFilters.push({
        type: 'name',
        label: this.filterName,
        value: this.filterName
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
    if (filterType === 'name') {
      this.filterName = '';
    } else if (filterType === 'status') {
      this.filterStatus = '';
    }
    
    // Re-apply search with remaining filters (this will update activeFilters)
    this.onSearch();
  }

  deleteRoom(id: number): void {
    if (confirm('Are you sure you want to delete this room?')) {
      this.apiService.deleteRoom(id).subscribe({
        next: () => {
          this.getRooms();
        },
        error: (error) => {
          console.error('Error deleting room:', error);
          alert('Failed to delete room. Please try again.');
        }
      });
    }
  }
}

