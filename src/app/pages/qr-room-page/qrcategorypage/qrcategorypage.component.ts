import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';




@Component({
  selector: 'app-qrcategorypage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qrcategorypage.component.html',
  styleUrl: './qrcategorypage.component.css'
})
export class QRCategorypageComponent implements OnInit {

  categoryName: string = '';
  allItems: any[] = [];
  subCategories: any[] = [];
  searchTerm: string = '';

  constructor(private location: Location) { }

  ngOnInit() {
    this.categoryName = sessionStorage.getItem('selectedCategoryName') || 'Category';
    const data = sessionStorage.getItem('selectedCategoryData');
    if (data) {
      try {
        this.allItems = JSON.parse(data);
        this.groupItems();
      } catch (e) {
        console.error('Error parsing category data', e);
      }
    }
  }

  groupItems() {
    const groups: { [key: string]: any[] } = {};

    // Filter by search term if exists
    const filteredItems = this.searchTerm
      ? this.allItems.filter(item =>
        item.itemName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(this.searchTerm.toLowerCase()))
      )
      : this.allItems;

    filteredItems.forEach(item => {
      const subCat = item.subCategory || 'Other';
      if (!groups[subCat]) {
        groups[subCat] = [];
      }
      groups[subCat].push(item);
    });

    this.subCategories = Object.keys(groups).map(key => ({
      name: key,
      items: groups[key],
      isOpen: true // Default all open
    }));
  }

  toggleCategory(index: number) {
    this.subCategories[index].isOpen = !this.subCategories[index].isOpen;
  }

  onSearch() {
    this.groupItems();
  }

  goBack() {
    this.location.back();
  }
}
