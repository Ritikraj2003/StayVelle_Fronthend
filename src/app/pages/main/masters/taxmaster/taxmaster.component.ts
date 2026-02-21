import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { LoaderService } from '../../../../core/services/loader.service';

@Component({
  selector: 'app-taxmaster',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './taxmaster.component.html',
  styleUrl: './taxmaster.component.css'
})
export class TaxmasterComponent implements OnInit {

  taxes: any[] = [];
  filteredTaxes: any[] = [];
  filterName: string = '';

  // Modal state
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingId: number | null = null;
  isSaving: boolean = false;
  error: string = '';

  // Form fields
  taxName: string = '';
  taxPercent: number | null = null;
  isActive: boolean = true;

  constructor(
    private apiService: ApiService,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    this.loadTaxes();
  }

  loadTaxes(): void {
    this.loaderService.show();
    this.apiService.getTaxes().subscribe({
      next: (data) => {
        this.taxes = data || [];
        this.filteredTaxes = [...this.taxes];
        this.loaderService.hide();
      },
      error: (err) => {
        console.error('Error loading taxes:', err);
        this.taxes = [];
        this.filteredTaxes = [];
        this.loaderService.hide();
      }
    });
  }

  onSearch(): void {
    const q = this.filterName.toLowerCase().trim();
    if (!q) {
      this.filteredTaxes = [...this.taxes];
    } else {
      this.filteredTaxes = this.taxes.filter(t =>
        (t.taxName || '').toLowerCase().includes(q)
      );
    }
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.taxName = '';
    this.taxPercent = null;
    this.isActive = true;
    this.error = '';
    this.showModal = true;
  }

  openEditModal(tax: any): void {
    this.isEditMode = true;
    this.editingId = tax.taxId;
    this.taxName = tax.taxName;
    this.taxPercent = tax.taxPercent;
    this.isActive = tax.isActive;
    this.error = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveTax(): void {
    if (!this.taxName || this.taxPercent === null) {
      this.error = 'Tax Name and Tax Percent are required.';
      return;
    }

    const payload = {
      taxName: this.taxName,
      taxPercent: Number(this.taxPercent),
      isActive: this.isActive
    };

    this.isSaving = true;
    this.error = '';
    this.loaderService.show();

    const call = this.isEditMode && this.editingId
      ? this.apiService.updateTax(this.editingId, payload)
      : this.apiService.createTax(payload);

    call.subscribe({
      next: () => {
        this.isSaving = false;
        this.loaderService.hide();
        this.closeModal();
        this.loadTaxes();
      },
      error: (err) => {
        console.error('Error saving tax:', err);
        this.error = err?.error?.message || 'Failed to save. Please try again.';
        this.isSaving = false;
        this.loaderService.hide();
      }
    });
  }

  deleteTax(id: number): void {
    if (!confirm('Are you sure you want to delete this tax?')) return;
    this.loaderService.show();
    this.apiService.deleteTax(id).subscribe({
      next: () => {
        this.loadTaxes();
        this.loaderService.hide();
      },
      error: (err) => {
        console.error('Error deleting tax:', err);
        alert(err?.error?.message || 'Failed to delete tax.');
        this.loaderService.hide();
      }
    });
  }
}
