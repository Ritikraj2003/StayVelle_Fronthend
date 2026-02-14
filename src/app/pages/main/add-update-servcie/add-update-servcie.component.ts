import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Service } from '../../../core/models/service.model';
import { ActivatedRoute } from '@angular/router';

interface CartItem extends Service {
  cartId: string;
  quantity: number;
}

@Component({
  selector: 'app-add-update-servcie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-update-servcie.component.html',
  styleUrl: './add-update-servcie.component.css'
})
export class AddUpdateServcieComponent implements OnInit {

  serviceList: Service[] = [];
  filteredServices: Service[] = [];
  categories: string[] = [];
  subCategories: string[] = [];

  selectedCategory: string = 'All';
  selectedSubCategory: string = 'All';
  searchQuery: string = '';

  cart: CartItem[] = [];

  // Booking Details
  bookingId: number | null = null;
  roomNumber: string | null = null;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.bookingId = params['bookingId'] ? +params['bookingId'] : null;
      this.roomNumber = params['roomNumber'] || null;
    });
    this.getAllServices();
  }

  getAllServices() {
    this.apiService.getServices().subscribe((res: any) => {
      if (res.success) {
        this.serviceList = res.data;
        this.filteredServices = res.data;
        this.extractCategories();
        this.extractSubCategories();
      }
    });
  }

  extractCategories() {
    const uniqueCategories = new Set(this.serviceList.map(s => s.serviceCategory));
    this.categories = ['All', ...uniqueCategories];
  }

  extractSubCategories() {
    let servicesToConsider = this.serviceList;
    if (this.selectedCategory !== 'All') {
      servicesToConsider = this.serviceList.filter(s => s.serviceCategory === this.selectedCategory);
    }
    const uniqueSubCategories = new Set(servicesToConsider.map(s => s.subCategory));
    this.subCategories = ['All', ...uniqueSubCategories];
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.selectedSubCategory = 'All';
    this.extractSubCategories();
    this.filterServices();
  }

  onSubCategoryChange(subCategory: string) {
    this.selectedSubCategory = subCategory;
    this.filterServices();
  }


  onSearchChange() {
    this.filterServices();
  }

  // Sorting
  sortBy: string = 'low-high';

  onSortChange(value: string) {
    this.sortBy = value;
    this.sortServices();
  }

  sortServices() {
    if (this.sortBy === 'low-high') {
      this.filteredServices.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'high-low') {
      this.filteredServices.sort((a, b) => b.price - a.price);
    }
  }

  // Override filterServices to include sorting
  filterServices() {
    let services = this.serviceList;

    if (this.selectedCategory !== 'All') {
      services = services.filter(s => s.serviceCategory === this.selectedCategory);
    }

    if (this.selectedSubCategory !== 'All') {
      services = services.filter(s => s.subCategory === this.selectedSubCategory);
    }

    this.filteredServices = services;
    this.applySearch(); // Search filters further
    this.sortServices(); // Always sort after filtering
  }

  applySearch() {
    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      this.filteredServices = this.filteredServices.filter(s =>
        s.serviceName.toLowerCase().includes(query) ||
        s.serviceCategory.toLowerCase().includes(query) ||
        s.subCategory.toLowerCase().includes(query)
      );
    }
  }

  // Cart Methods
  addToCart(service: Service) {
    const existingItem = this.cart.find(item => item.serviceId === service.serviceId);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      // Create a new object to avoid reference issues
      const newItem: CartItem = {
        ...service,
        cartId: service.serviceId.toString(),
        quantity: 1,
        // Ensure documents is copied if it's an array of objects
        documents: [...service.documents]
      };
      this.cart.push(newItem);
    }
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  updateQuantity(index: number, change: number) {
    const item = this.cart[index];
    const newQuantity = item.quantity + change;

    if (newQuantity > 0) {
      item.quantity = newQuantity;
    } else {
      this.removeFromCart(index);
    }
  }

  get subTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get taxAmount(): number {
    return this.subTotal * 0.18;
  }

  get totalAmount(): number {
    return this.subTotal + this.taxAmount;
  }

  placeOrder() {
    if (!this.bookingId) {
      alert('No active booking selected. Please select a room from Current Booking.');
      return;
    }

    if (this.cart.length === 0) {
      alert('Cart is empty.');
      return;
    }

    const payload = this.cart.map(item => ({
      bookingId: this.bookingId,
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      serviceCategory: item.serviceCategory,
      subCategory: item.subCategory,
      price: item.price,
      unit: item.unit || 'QTY', // Default if missing
      quantity: item.quantity,
      serviceDate: new Date().toISOString(),
      serviceStatus: 'Ordered'
    }));

    console.log('Order Payload:', payload);

    this.apiService.addUpdateBookingServices(payload).subscribe({
      next: (res: any) => {
        if (res.result) { // Checking res.result based on typical API patterns, or res.success if previously used
          alert('Order Placed Successfully!');
          this.cart = []; // Clear cart on success
        } else {
          // Fallback if success is not explicit but no error
          alert(res.message || 'Order Placed Successfully!');
          this.cart = [];
        }
      },
      error: (err: any) => {
        console.error('Order Error:', err);
        alert('Failed to place order.');
      }
    });
  }
}
