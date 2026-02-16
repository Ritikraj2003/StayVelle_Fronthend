import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Action } from 'rxjs/internal/scheduler/Action';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-qrhome-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qrhome-page.component.html',
  styleUrl: './qrhome-page.component.css'
})
export class QRHomePageComponent implements OnInit {
  guestName = 'Mr. Henderson';
  roomNumber = '305';

  wifiNetwork = 'HMS_Premium_Guest';
  wifiPassword = 'LuxuryStay2024';

  currentOrder = {
    item: 'Margherita Pizza',
    orderId: '#8821',
    status: 'In Progress',
    estimatedTime: '12 mins',
    progress: 70
  };

  services: any[] = [];
  accessPin = '1234'; // Hardcoded as per requirement


  uniqueCategories: any[] = [];

  categoryIcons: { [key: string]: string } = {
    'Food': 'ri-restaurant-2-fill',
    'Laundry': 'ri-shirt-fill',
    'Spa': 'ri-mental-health-fill',
    'Gym': 'ri-run-fill',
    'Room Service': 'ri-customer-service-2-fill',
    'Transport': 'ri-taxi-fill',
    'Cleaning': 'ri-home-gear-fill',
    'default': 'ri-service-fill'
  };
  constructor(private router: Router, private apiService: ApiService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const bookingId = params['bookingId'];
      if (bookingId) {
        this.loadRoomServices(Number(bookingId));
      } else {
        this.loadRoomServices();
      }
    });
  }

  loadRoomServices(bookingId?: number) {
    let requestData: any = {};

    if (bookingId) {
      requestData = { BookingId: bookingId };
    } else {
      requestData = {
        RoomId: 1, // Hardcoded as per requirement
        AccessPin: '6205041011'
      };
    }

    this.apiService.getRoomServices(requestData).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.guestName = res.data.guestName;

          if (res.data.allService && Array.isArray(res.data.allService)) {
            this.services = res.data.allService.map((s: any) => ({
              category: s.serviceCategory,
              subCategory: s.subCategory,
              itemName: s.serviceName,
              price: s.price,
              imageUrl: s.documents && s.documents.length > 0 ? s.documents[0].filePath : 'assets/placeholder.jpg',
              description: s.documents && s.documents.length > 0 ? s.documents[0].description : ''
            }));

            this.extractUniqueCategories();
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching room services:', err);
      }
    });
  }

  extractUniqueCategories() {
    // Group by category and take the first item as representative for the image
    const categoriesMap = new Map();

    this.services.forEach(item => {
      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, {
          category: item.category,
          imageUrl: item.imageUrl,
          // Dynamically assign icon based on the map
          icon: this.categoryIcons[item.category] || this.categoryIcons['default']
        });
      }
    });

    this.uniqueCategories = Array.from(categoriesMap.values());
  }

  onCategoryClick(cat: any) {
    const categoryData = this.services.filter(item => item.category === cat.category);
    sessionStorage.setItem('selectedCategoryData', JSON.stringify(categoryData));
    sessionStorage.setItem('selectedCategoryName', cat.category);
    this.router.navigate(['/qr-room-page/category']);
    console.log(`Saved ${cat.category} data to session storage.`);
  }
}
