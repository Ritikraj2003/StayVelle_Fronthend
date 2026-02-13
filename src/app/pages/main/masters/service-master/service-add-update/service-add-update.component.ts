import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../../../core/services/loader.service';
import { ApiService } from '../../../../../core/services/api.service';
interface UploadedImage {
  file: File;
  name: string;
  preview: string;
}
@Component({
  selector: 'app-service-add-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './service-add-update.component.html',
  styleUrl: './service-add-update.component.css'
})
export class ServiceAddUpdateComponent implements OnInit {
  serviceForm: FormGroup;
  serviceId: number | null = null;
  isEditMode: boolean = false;
  uploadedImages: UploadedImage[] = [];
  existingImages: string[] = []; // Images from API (base64 or URLs)

  serviceCategories: string[] = [];

  showCategoryDropdown: boolean = false;
  showSubCategoryDropdown: boolean = false;
  filteredCategories: string[] = [];
  filteredSubCategories: string[] = [];

  // Dummy Data
  subCategoriesMap: any = {};

  // Form Controls for Search Inputs
  categoryInput: string = '';
  subCategoryInput: string = '';

  // Mock Data from User
  allService: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private loaderService: LoaderService
  ) {
    this.serviceForm = this.fb.group({
      serviceName: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0)]],
      unit: ['', [Validators.required]],
      description: [''],
      isActive: [true],
      isComplementary: [false],
      serviceCategory: ['', [Validators.required]],
      subCategory: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Fetch all services to populate dropdowns first
    this.getAllServices();

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.serviceId = +params['id'];
        this.isEditMode = true;
        this.getServiceById(this.serviceId);
      }
    });
  }

  getAllServices() {

    this.loaderService.show();
    this.apiService.getServices().subscribe({
      next: (res: any) => {
        if (res.success == true) {
          this.allService = res.data;
          const categories = new Set<string>();
          const subCatMap: any = {};

          this.allService.forEach((service: any) => {
            if (service.serviceCategory) {
              categories.add(service.serviceCategory);

              if (!subCatMap[service.serviceCategory]) {
                subCatMap[service.serviceCategory] = new Set<string>();
              }
              if (service.subCategory) {
                subCatMap[service.serviceCategory].add(service.subCategory);
              }
            }
          });

          this.serviceCategories = Array.from(categories);

          this.subCategoriesMap = {};
          Object.keys(subCatMap).forEach(key => {
            this.subCategoriesMap[key] = Array.from(subCatMap[key]);
          });

          this.filteredCategories = [...this.serviceCategories];

          // Re-filter if category is selected (e.g. edit mode loaded first)
          const currentCategory = this.serviceForm.get('serviceCategory')?.value;
          if (currentCategory) {
            this.filterSubCategories();
          }

          this.loaderService.hide();
        }
      },
      error: (error) => {
        console.error('Error loading rooms:', error);

        this.loaderService.hide();
        alert('Failed to load rooms. Please try again.');
      }
    });
    // Simulating API call with mock data as requested
    // this.allService = [
    //   { serviceId: 1, serviceCategory: 'Foodeeeee', subCategory: 'Thalieeee', serviceName: 'Veg Thali', price: 180, unit: 'Plate', isActive: true },
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
    debugger

  }

  getServiceById(id: number) {
    this.loaderService.show();
    this.apiService.getServiceById(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          const service = res.data;
          this.serviceForm.patchValue({
            serviceName: service.serviceName,
            price: service.price,
            unit: service.unit,
            isActive: service.isActive,
            isComplementary: service.isComplementary,
            serviceCategory: service.serviceCategory,
            subCategory: service.subCategory,
            description: service.description || ''
          });

          // Update local inputs for the searchable dropdown
          this.categoryInput = service.serviceCategory || '';
          this.subCategoryInput = service.subCategory || '';
          this.filterSubCategories();

          // Handle Documents (Images)
          if (service.documents && service.documents.length > 0) {
            this.existingImages = service.documents.map((d: any) => d.filePath || d.url);
          }
        }
        this.loaderService.hide();
      },
      error: (error: any) => {
        console.error('Error fetching service:', error);
        this.loaderService.hide();
        alert('Failed to load service details.');
      }
    });
  }

  // Category Logic
  onCategoryInput(event: any) {
    const value = event.target.value;
    this.categoryInput = value;
    this.serviceForm.patchValue({ serviceCategory: value });

    if (value) {
      this.filteredCategories = this.serviceCategories.filter(c =>
        c.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      this.filteredCategories = [...this.serviceCategories];
    }
    this.showCategoryDropdown = true;
  }

  selectCategory(category: string) {
    this.categoryInput = category;
    this.serviceForm.patchValue({ serviceCategory: category });
    this.showCategoryDropdown = false;

    // Reset sub category
    this.subCategoryInput = '';
    this.serviceForm.patchValue({ subCategory: '' });
    this.filterSubCategories();
  }

  // Sub Category Logic
  onSubCategoryInput(event: any) {
    const value = event.target.value;
    this.subCategoryInput = value;
    this.serviceForm.patchValue({ subCategory: value });

    this.filterSubCategories(value);
    this.showSubCategoryDropdown = true;
  }

  filterSubCategories(searchValue: string = '') {
    const currentCategory = this.serviceForm.get('serviceCategory')?.value;
    let availableSubCategories = [];

    if (currentCategory && this.subCategoriesMap[currentCategory]) {
      availableSubCategories = this.subCategoriesMap[currentCategory];
    } else {
      // If new category or no mapping, maybe show nothing or allow free text
      availableSubCategories = [];
    }

    if (searchValue) {
      this.filteredSubCategories = availableSubCategories.filter((s: string) =>
        s.toLowerCase().includes(searchValue.toLowerCase())
      );
    } else {
      this.filteredSubCategories = [...availableSubCategories];
    }
  }

  selectSubCategory(subCategory: string) {
    this.subCategoryInput = subCategory;
    this.serviceForm.patchValue({ subCategory: subCategory });
    this.showSubCategoryDropdown = false;
  }

  // Close dropdowns when clicking outside
  closeDropdowns() {
    // using timeout to allow click event to register first
    setTimeout(() => {
      this.showCategoryDropdown = false;
      this.showSubCategoryDropdown = false;
    }, 200);
  }



  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (validTypes.includes(file.type)) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.uploadedImages.push({
              file: file,
              name: file.name,
              preview: e.target.result
            });
          };
          reader.readAsDataURL(file);
        } else {
          alert('Please select only jpg, png, or svg files');
        }
      });
    }
  }

  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
  }

  async onSubmit(): Promise<void> {
    if (this.serviceForm.valid) {
      this.loaderService.show();
      const formData = await this.prepareFormData();

      if (this.isEditMode && this.serviceId) {
        this.apiService.updateService(this.serviceId, formData).subscribe({
          next: () => {
            this.loaderService.hide();
            this.router.navigate(['/main/masters/service-master']);
          },
          error: (error: any) => {
            console.error('Error updating service:', error);
            alert('Failed to update service. Please try again.');
            this.loaderService.hide();
          }
        });
      } else {
        this.apiService.createService(formData).subscribe({
          next: () => {
            this.loaderService.hide();
            this.router.navigate(['/main/masters/service-master']);
          },
          error: (error: any) => {
            console.error('Error creating service:', error);
            alert('Failed to create service. Please try again.');
            this.loaderService.hide();
          }
        });
      }
    }
  }

  async saveAndAddAnother(): Promise<void> {
    if (this.serviceForm.valid) {
      this.loaderService.show();
      const formData = await this.prepareFormData();

      if (this.isEditMode && this.serviceId) {
        // Update current service first
        this.apiService.updateService(this.serviceId, formData).subscribe({
          next: () => {
            // Reset form for adding another service
            this.resetFormForNewService();
            this.loaderService.hide();
          },
          error: (error: any) => {
            console.error('Error updating service:', error);
            alert('Failed to update service. Please try again.');
            this.loaderService.hide();
          }
        });
      } else {
        // Create service
        this.apiService.createService(formData).subscribe({
          next: () => {
            // Reset form for adding another service
            this.resetFormForNewService();
            alert('Service created successfully!');
            this.loaderService.hide();
          },
          error: (error: any) => {
            console.error('Error creating service:', error);
            alert('Failed to create service. Please try again.');
            this.loaderService.hide();
          }
        });
      }
    }
  }

  private resetFormForNewService(): void {
    this.serviceForm.reset({
      isActive: true,
      isComplementary: false,
      description: '',
      unit: ''
    });
    this.uploadedImages = [];
    this.existingImages = [];
    this.isEditMode = false;
    this.serviceId = null;
  }

  private async prepareFormData(): Promise<FormData> {
    const formValue = this.serviceForm.value;
    const formData = new FormData();

    formData.append('ServiceCategory', formValue.serviceCategory);
    formData.append('SubCategory', formValue.subCategory);
    formData.append('ServiceName', formValue.serviceName);
    formData.append('Price', formValue.price);
    formData.append('Unit', formValue.unit);
    formData.append('IsComplementary', String(formValue.isComplementary));
    formData.append('IsActive', String(formValue.isActive));
    // formData.append('Description', formValue.description || ''); // Description not in screenshot, but good to keep if API supports it, or remove if strict. Keeping out for now based on screenshot unless user asked. The screenshot didn't show description but the form has it. I'll omit it to be safe or add if needed. The screenshot shows: ServiceCategory, SubCategory, ServiceName, Price, Unit, IsComplementary, IsActive, Image. 

    // Handle Documents (Images)
    if (this.uploadedImages.length > 0) {
      for (let i = 0; i < this.uploadedImages.length; i++) {
        const image = this.uploadedImages[i];

        formData.append(`Documents[${i}].filePath`, '');
        formData.append(`Documents[${i}].fileName`, image.name);
        formData.append(`Documents[${i}].documentType`, 'Image');
        formData.append(`Documents[${i}].documentId`, '0');
        formData.append(`Documents[${i}].isPrimary`, i === 0 ? 'true' : 'false');
        formData.append(`Documents[${i}].file`, image.file);
        formData.append(`Documents[${i}].description`, '');
        formData.append(`Documents[${i}].entityType`, 'Service');
        formData.append(`Documents[${i}].entityId`, '0');
      }
    }


    return formData;
  }

  private parseImages(imagesJson: string): string[] {
    if (!imagesJson) {
      return [];
    }
    try {
      return JSON.parse(imagesJson);
    } catch {
      // If parsing fails, return empty array or the string as single item
      return imagesJson ? [imagesJson] : [];
    }
  }



  removeExistingImage(index: number): void {
    this.existingImages.splice(index, 1);
  }

  cancel(): void {
    this.router.navigate(['/main/masters/service-master']);
  }
}
