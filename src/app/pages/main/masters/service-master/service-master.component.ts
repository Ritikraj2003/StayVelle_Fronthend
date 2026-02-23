import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { Router, RouterModule } from '@angular/router';
import { LoaderService } from '../../../../core/services/loader.service';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-service-master',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './service-master.component.html',
  styleUrl: './service-master.component.css'
})
export class ServiceMasterComponent implements OnInit {
  public Math = Math;
  allService: any[] = [];
  filteredService: any[] = [];
  isLoading: boolean = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  get totalPages(): number {
    return Math.ceil(this.filteredService.length / this.pageSize);
  }

  get pagedService(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredService.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  // Filter properties
  filterName: string = '';
  filterStatus: string = '';

  // Active filters array
  activeFilters: Array<{ type: string, label: string, value: string }> = [];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private loaderService: LoaderService,
    private notification: NotificationService
  ) { }

  ngOnInit(): void {
    // Load rooms data
    this.getServices();
  }

  getServices(): void {

    this.isLoading = true;
    this.loaderService.show();
    this.apiService.getServices().subscribe({
      next: (res: any) => {
        if (res.success == true) {
          this.allService = res.data;
          this.filteredService = [...this.allService];
          this.isLoading = false;
          this.loaderService.hide();
        }
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        this.isLoading = false;
        this.loaderService.hide();
        this.notification.error('Failed to load services. Please try again.');
      }
    });


    // this.allService = [
    //   { serviceId: 1, serviceCategory: 'Food', subCategory: 'Thali', serviceName: 'Veg Thali', price: 180, unit: 'Plate', isActive: true },
    //   { serviceId: 2, serviceCategory: 'Food', subCategory: 'Tea', serviceName: 'Tea', price: 30, unit: 'Cup', isActive: true },
    //   { serviceId: 3, serviceCategory: 'Laundry', subCategory: 'Wash', serviceName: 'Shirt Wash', price: 50, unit: 'Piece', isActive: true },
    //   { serviceId: 4, serviceCategory: 'Laundry', subCategory: 'Iron', serviceName: 'Pant Iron', price: 30, unit: 'Piece', isActive: false },
    //   { serviceId: 5, serviceCategory: 'Spa', subCategory: 'Full Body', serviceName: 'Full Body Spa', price: 1500, unit: 'Hour', isActive: true },
    //   { serviceId: 6, serviceCategory: 'Spa', subCategory: 'Full Body', serviceName: 'Full Body Spa', price: 1500, unit: 'Hour', isActive: true },
    //   { serviceId: 7, serviceCategory: 'Spa', subCategory: 'Full Body', serviceName: 'Full Body Spa', price: 1500, unit: 'Hour', isActive: true },
    //   { serviceId: 8, serviceCategory: 'Spa', subCategory: 'Full Body', serviceName: 'Full Body Spa', price: 1500, unit: 'Hour', isActive: true },
    //   { serviceId: 9, serviceCategory: 'Spa', subCategory: 'Full Body', serviceName: 'Full Body Spa', price: 1500, unit: 'Hour', isActive: true },
    //   { serviceId: 10, serviceCategory: 'Spa', subCategory: 'Full Body', serviceName: 'Full Body Spa', price: 1500, unit: 'Hour', isActive: true },
    // ];

    // this.isLoading = true;
    // this.loaderService.show();
    // this.apiService.getRooms().subscribe({
    //   next: (service) => {
    //     this.allService = service;
    // this.filteredService = [...this.allService];
    //     this.isLoading = false;
    //     this.loaderService.hide();
    //   },
    //   error: (error) => {
    //     console.error('Error loading rooms:', error);
    //     this.isLoading = false;
    //     this.loaderService.hide();
    //     alert('Failed to load rooms. Please try again.');
    //   }
    // });
  }

  applyFilters(): void {
    let filtered = [...this.allService];

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

    this.filteredService = filtered;
    this.currentPage = 1;
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
      this.loaderService.show();
      this.apiService.deleteRoom(id).subscribe({
        next: () => {
          this.getServices();
          this.loaderService.hide();
        },
        error: (error) => {
          console.error('Error deleting room:', error);
          this.notification.error('Failed to delete service. Please try again.');
          this.loaderService.hide();
        }
      });
    }
  }
}

