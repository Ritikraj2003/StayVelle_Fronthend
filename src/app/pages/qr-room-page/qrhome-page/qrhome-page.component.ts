import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

  services = [
    // Food
    {
      category: 'Food',
      subCategory: 'Breakfast',
      itemName: 'Healthy Breakfast Combo',
      price: 120,
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop'
    },
    {
      category: 'Food',
      subCategory: 'Breakfast',
      itemName: 'Healteahy Breakfast Combo',
      price: 120,
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop'
    },
    {
      category: 'Food',
      subCategory: 'Breakfast',
      itemName: 'tea',
      price: 120,
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop'
    },
    {
      category: 'Food',
      subCategory: 'Lunch',
      itemName: 'Veg Lunch Thali',
      price: 250,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1780&auto=format&fit=crop'
    },
    {
      category: 'Food',
      subCategory: 'Dinner',
      itemName: 'Special Dinner Meal',
      price: 350,
      imageUrl: 'https://images.unsplash.com/photo-1515516946091-7a810f277d34?q=80&w=2070&auto=format&fit=crop'
    },
    {
      category: 'Food',
      subCategory: 'Snacks',
      itemName: 'Evening Snacks Plate',
      price: 80,
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=2080&auto=format&fit=crop'
    },

    // Laundry
    {
      category: 'Laundry',
      subCategory: 'Wash & Fold',
      itemName: 'Wash & Fold Service',
      price: 150,
      imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb8f?q=80&w=2071&auto=format&fit=crop'
    },
    {
      category: 'Laundry',
      subCategory: 'Dry Cleaning',
      itemName: 'Premium Dry Cleaning',
      price: 300,
      imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=2070&auto=format&fit=crop'
    },
    {
      category: 'Laundry',
      subCategory: 'Ironing',
      itemName: 'Clothes Ironing',
      price: 100,
      imageUrl: 'https://images.unsplash.com/photo-1489274495759-f5db6a9d36f8?q=80&w=1974&auto=format&fit=crop'
    },

    // Spa
    {
      category: 'Spa',
      subCategory: 'Head Massage',
      itemName: 'Relaxing Head Massage',
      price: 600,
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop'
    },
    {
      category: 'Spa',
      subCategory: 'Full Body Massage',
      itemName: 'Full Body Relaxation Therapy',
      price: 1800,
      imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=1974&auto=format&fit=crop'
    },

    // Gym
    {
      category: 'Gym',
      subCategory: 'Daily Pass',
      itemName: 'Gym Daily Access',
      price: 200,
      imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop'
    },
    {
      category: 'Gym',
      subCategory: 'Monthly Membership',
      itemName: 'Monthly Gym Membership',
      price: 1500,
      imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop'
    },

    // Room Service
    {
      category: 'Room Service',
      subCategory: 'Water Bottle',
      itemName: 'Mineral Water Bottle',
      price: 40,
      imageUrl: 'https://images.unsplash.com/photo-1616118132534-381148898bb8?q=80&w=1964&auto=format&fit=crop'
    },
    {
      category: 'Room Service',
      subCategory: 'Tea / Coffee',
      itemName: 'Hot Tea / Coffee',
      price: 60,
      imageUrl: 'https://images.unsplash.com/photo-1520038410233-7141dd882cb0?q=80&w=2074&auto=format&fit=crop'
    },

    // Transport
    {
      category: 'Transport',
      subCategory: 'Airport Pickup',
      itemName: 'Airport Pickup Service',
      price: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop'
    },

    // Cleaning
    {
      category: 'Cleaning',
      subCategory: 'Deep Cleaning',
      itemName: 'Full Room Deep Cleaning',
      price: 1200,
      imageUrl: 'https://plus.unsplash.com/premium_photo-1683748281357-d3da775276c1?q=80&w=2070&auto=format&fit=crop'
    }
  ];


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
  constructor(private router: Router) { }

  ngOnInit() {
    this.extractUniqueCategories();
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
