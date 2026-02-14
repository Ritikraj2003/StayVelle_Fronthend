import { Component, OnInit } from '@angular/core';
import { jsPDF } from 'jspdf';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { LoaderService } from '../../../../core/services/loader.service';

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
  activeFilters: Array<{ type: string, label: string, value: string }> = [];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    // Load rooms data
    this.getRooms();
  }

  getRooms(): void {
    this.isLoading = true;
    this.loaderService.show();
    this.apiService.getRooms().subscribe({
      next: (rooms) => {
        this.allRooms = rooms;
        this.filteredRooms = [...this.allRooms];
        this.isLoading = false;
        this.loaderService.hide();
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        this.isLoading = false;
        this.loaderService.hide();
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

  // QR Modal properties
  showQrModal: boolean = false;
  selectedRoomQrUrl: string = '';
  selectedRoomNumber: string = '';

  deleteRoom(id: number): void {
    if (confirm('Are you sure you want to delete this room?')) {
      this.loaderService.show();
      this.apiService.deleteRoom(id).subscribe({
        next: () => {
          this.getRooms();
          this.loaderService.hide();
        },
        error: (error) => {
          console.error('Error deleting room:', error);
          alert('Failed to delete room. Please try again.');
          this.loaderService.hide();
        }
      });
    }
  }

  printQr(room: any): void {
    if (room.roomQrToken) {
      const url = `http://localhost:4200/qr-room-page?token=${room.roomQrToken}`;
      // Use a public QR code API to generate the image source
      this.selectedRoomQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      this.selectedRoomNumber = room.roomNumber || 'Unknown';
      this.showQrModal = true;
    } else {
      alert('QR Code token not available for this room.');
    }
  }

  closeQrModal(): void {
    this.showQrModal = false;
    this.selectedRoomQrUrl = '';
    this.selectedRoomNumber = '';
  }

  downloadQr(): void {
    if (!this.selectedRoomQrUrl) return;

    // Fetch the image to get it as a blob/base64
    fetch(this.selectedRoomQrUrl)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;

          // Create PDF
          const pdf = new jsPDF();

          // Add Title
          pdf.setFontSize(20);
          pdf.text(`Room ${this.selectedRoomNumber}`, 105, 20, { align: 'center' });

          // Add QR Code Image
          // (imageData, format, x, y, width, height)
          pdf.addImage(base64data, 'PNG', 55, 40, 100, 100);

          // Add Footer text
          pdf.setFontSize(12);
          pdf.text('Scan to access room services', 105, 150, { align: 'center' });

          // Save PDF
          pdf.save(`Room-${this.selectedRoomNumber}-QR.pdf`);
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error('Error generating PDF:', err);
        alert('Failed to generate PDF. Please try again.');
        // Fallback or just error
      });
  }
}
