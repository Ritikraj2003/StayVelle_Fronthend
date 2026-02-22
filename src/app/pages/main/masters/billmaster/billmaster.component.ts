import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── Data Interfaces ─────────────────────────────────────────────────────────

export interface BillField {
  id: string;
  label: string;       // editable display label
  binding: string;     // token e.g. {HotelName}
  value: string;       // manual fallback
  // per-field style
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
  align: 'left' | 'center' | 'right';
  visible: boolean;
}

export interface TableColumn {
  id: string;
  header: string;
  binding: string;
  visible: boolean;
  align: 'left' | 'center' | 'right';
}

export interface SectionStyle {
  fontSize: number;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  color: string;
  background: string;
  borderTop: boolean;
  borderBottom: boolean;
  paddingTop: number;
  paddingBottom: number;
}

export interface BillSection {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  fields: BillField[];
  columns?: TableColumn[];
  style: SectionStyle;
}

export interface BillTemplate {
  id: string;
  name: string;
  logoBase64: string;
  logoPosition: 'left' | 'center' | 'right';
  logoWidth: number;
  invoiceTitle: string;
  sections: BillSection[];
  isDefault: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_STYLE: SectionStyle = {
  fontSize: 12, bold: false, italic: false, align: 'left',
  color: '#333333', background: '#ffffff',
  borderTop: false, borderBottom: false,
  paddingTop: 6, paddingBottom: 6
};

const AVAILABLE_BINDINGS: string[] = [
  '{HotelName}', '{HotelAddress}', '{HotelPhone}', '{HotelEmail}',
  '{HotelWebsite}', '{GSTNo}',
  '{InvoiceNo}', '{InvoiceDate}',
  '{CustomerName}', '{CustomerAddress}', '{CustomerPhone}',
  '{BookingId}', '{CheckIn}', '{CheckOut}',
  '{RoomNumber}', '{RoomType}', '{Nights}', '{PaymentMode}',
  '{Subtotal}', '{Tax}', '{AdvancePaid}', '{GrandTotal}',
  '{AmountInWords}', '{BilledBy}'
];

const SAMPLE_DATA: Record<string, string> = {
  '{HotelName}': 'StayVelle Hotel',
  '{HotelAddress}': 'Bangalore, Karnataka, India - 560001',
  '{HotelPhone}': '+91 9999999999',
  '{HotelEmail}': 'info@stayvelle.com',
  '{HotelWebsite}': 'www.stayvelle.com',
  '{GSTNo}': 'GST No: 29ABCDE1234F1Z5',
  '{InvoiceNo}': '00008',
  '{InvoiceDate}': '17 Feb 2026, 02:28 AM',
  '{CustomerName}': 'Vinay Kumar',
  '{CustomerAddress}': 'Hyderabad, Telangana - 500001',
  '{CustomerPhone}': '+91 9101223042',
  '{BookingId}': 'BK-1042',
  '{CheckIn}': '20 Feb 2026',
  '{CheckOut}': '21 Feb 2026',
  '{RoomNumber}': '7777',
  '{RoomType}': 'Deluxe',
  '{Nights}': '1',
  '{PaymentMode}': 'Cash',
  '{Subtotal}': '1600.00',
  '{Tax}': '165.00',
  '{AdvancePaid}': '50.00',
  '{GrandTotal}': '1715.00',
  '{AmountInWords}': 'One thousand seven hundred fifteen only',
  '{BilledBy}': 'admin'
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeId(): string { return Math.random().toString(36).slice(2, 9); }

function makeField(
  label: string, binding: string,
  opts: Partial<BillField> = {}
): BillField {
  return {
    id: makeId(), label, binding, value: '',
    fontSize: 12, bold: false, italic: false,
    color: '#333333', align: 'left', visible: true,
    ...opts
  };
}

function defaultSections(): BillSection[] {
  return [
    // 1. Header: logo + hotel information
    {
      id: makeId(), type: 'header', label: 'Header', visible: true,
      fields: [
        makeField('Hotel Name', '{HotelName}', { fontSize: 16, bold: true, color: '#111111', align: 'right' }),
        makeField('Address', '{HotelAddress}', { fontSize: 11, color: '#555555', align: 'right' }),
        makeField('Phone', '{HotelPhone}', { fontSize: 11, color: '#555555', align: 'right' }),
        makeField('Email', '{HotelEmail}', { fontSize: 11, color: '#1a6fc4', align: 'right' }),
        makeField('Website', '{HotelWebsite}', { fontSize: 11, color: '#1a6fc4', align: 'right' }),
        makeField('GST No', '{GSTNo}', { fontSize: 11, color: '#555555', align: 'right' }),
      ],
      style: { ...DEFAULT_STYLE, borderBottom: true }
    },
    // 2. Bill To: customer details
    {
      id: makeId(), type: 'bill-to', label: 'Bill To', visible: true,
      fields: [
        makeField('Guest Name', '{CustomerName}', { fontSize: 14, bold: true, color: '#1a6fc4' }),
        makeField('Address', '{CustomerAddress}', { fontSize: 11, color: '#555555' }),
        makeField('Phone', '{CustomerPhone}', { fontSize: 11, color: '#555555' }),
        makeField('Booking ID', '{BookingId}', { fontSize: 11, color: '#555555' }),
      ],
      style: { ...DEFAULT_STYLE }
    },
    // 3. Invoice Details (right side of meta row)
    {
      id: makeId(), type: 'invoice-details', label: 'Invoice Details', visible: true,
      fields: [
        makeField('Invoice No', '{InvoiceNo}', { fontSize: 11, color: '#111111' }),
        makeField('Date', '{InvoiceDate}', { fontSize: 11, color: '#111111' }),
        makeField('Room', '{RoomNumber}', { fontSize: 11, color: '#111111' }),
        makeField('Room Type', '{RoomType}', { fontSize: 11, color: '#c0392b' }),
        makeField('Check-In', '{CheckIn}', { fontSize: 11, color: '#111111' }),
        makeField('Check-Out', '{CheckOut}', { fontSize: 11, color: '#111111' }),
        makeField('Nights', '{Nights}', { fontSize: 11, color: '#111111' }),
        makeField('Payment Mode', '{PaymentMode}', { fontSize: 11, color: '#111111' }),
      ],
      style: { ...DEFAULT_STYLE }
    },
    // 4. Items Table
    {
      id: makeId(), type: 'items-table', label: 'Items Table', visible: true,
      fields: [],
      columns: [
        { id: makeId(), header: 'Item', binding: 'item', visible: true, align: 'left' },
        { id: makeId(), header: 'Qty', binding: 'qty', visible: true, align: 'center' },
        { id: makeId(), header: 'Rate', binding: 'rate', visible: true, align: 'right' },
        { id: makeId(), header: 'GST', binding: 'gst', visible: true, align: 'right' },
        { id: makeId(), header: 'Amount', binding: 'amount', visible: true, align: 'right' },
      ],
      style: { ...DEFAULT_STYLE }
    },
    // 5. Calculation: subtotal, tax, grand total
    {
      id: makeId(), type: 'calculation', label: 'Calculation', visible: true,
      fields: [
        makeField('Sub Total (Rs.)', '{Subtotal}', { fontSize: 12, color: '#333333' }),
        makeField('Tax (Rs.)', '{Tax}', { fontSize: 12, color: '#333333' }),
        makeField('Advance Paid (Rs.).', '{AdvancePaid}', { fontSize: 12, color: '#c0392b' }),
        makeField('Grand Total (Rs.)', '{GrandTotal}', { fontSize: 14, bold: true, color: '#111111' }),
      ],
      style: { ...DEFAULT_STYLE, borderTop: true }
    },
    // 6. Footer
    {
      id: makeId(), type: 'footer', label: 'Footer', visible: true,
      fields: [
        makeField('Thank You Note', '', {
          fontSize: 11, italic: true, color: '#555555', align: 'left',
          value: 'Thank you for staying with us!'
        }),
        makeField('Amount in Words', '{AmountInWords}', { fontSize: 11, italic: true, color: '#1a6fc4' }),
        makeField('Signature Label', '', {
          fontSize: 13, bold: true, color: '#222222', align: 'right',
          value: 'Authorised Signatory'
        }),
      ],
      style: { ...DEFAULT_STYLE, borderTop: true }
    },
  ];
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-billmaster',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billmaster.component.html',
  styleUrl: './billmaster.component.css'
})
export class BillmasterComponent implements OnInit {

  // ── List view ───────────────────────────────────────────────────────────
  bills: any[] = [];
  filteredBills: any[] = [];
  filterName: string = '';
  designerOpen: boolean = false;

  // ── Designer state ──────────────────────────────────────────────────────
  templateName: string = 'My Invoice Template';
  invoiceTitle: string = 'INVOICE';

  // Logo (shared, sits in header)
  logoBase64: string = '';
  logoPosition: 'left' | 'center' | 'right' = 'left';
  logoWidth: number = 80;

  sections: BillSection[] = [];
  selectedSection: BillSection | null = null;
  availableBindings: string[] = AVAILABLE_BINDINGS;
  templates: BillTemplate[] = [];

  // Drag-drop
  dragSrcIndex: number = -1;

  ngOnInit(): void {
    this.loadTemplatesFromStorage();
    this.bills = [];
    this.filteredBills = [];
  }

  // ── List view ────────────────────────────────────────────────────────────
  onSearch(): void {
    const q = this.filterName.toLowerCase().trim();
    this.filteredBills = q
      ? this.bills.filter(b => (b.billName || '').toLowerCase().includes(q))
      : [...this.bills];
  }

  openDesigner(): void {
    this.sections = defaultSections();
    this.selectedSection = this.sections[0];
    this.designerOpen = true;
  }

  closeDesigner(): void { this.designerOpen = false; }

  // ── Section management ───────────────────────────────────────────────────
  selectSection(section: BillSection): void {
    this.selectedSection = section;
  }

  removeSection(section: BillSection): void {
    this.sections = this.sections.filter(s => s.id !== section.id);
    if (this.selectedSection?.id === section.id) this.selectedSection = null;
  }

  toggleSection(section: BillSection): void { section.visible = !section.visible; }

  onDragStart(index: number): void { this.dragSrcIndex = index; }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (this.dragSrcIndex === index) return;
    const moved = this.sections.splice(this.dragSrcIndex, 1)[0];
    this.sections.splice(index, 0, moved);
    this.dragSrcIndex = index;
  }

  onDragEnd(): void { this.dragSrcIndex = -1; }

  addSection(): void {
    const s: BillSection = {
      id: makeId(), type: 'custom', label: 'New Section', visible: true,
      fields: [makeField('Field 1', '', { value: 'Custom text' })],
      style: { ...DEFAULT_STYLE }
    };
    this.sections.push(s);
    this.selectedSection = s;
  }

  // ── Field management ─────────────────────────────────────────────────────
  addField(section: BillSection): void {
    section.fields.push(makeField('New Field', ''));
  }

  removeField(section: BillSection, field: BillField): void {
    section.fields = section.fields.filter(f => f.id !== field.id);
  }

  // ── Table column management ──────────────────────────────────────────────
  addColumn(section: BillSection): void {
    if (!section.columns) section.columns = [];
    section.columns.push({
      id: makeId(), header: 'Column', binding: 'custom', visible: true, align: 'left'
    });
  }

  removeColumn(section: BillSection, col: TableColumn): void {
    if (section.columns) section.columns = section.columns.filter(c => c.id !== col.id);
  }

  // ── Logo ─────────────────────────────────────────────────────────────────
  onLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.logoBase64 = reader.result as string; };
    reader.readAsDataURL(file);
  }

  removeLogo(): void { this.logoBase64 = ''; }

  // ── Preview helpers ───────────────────────────────────────────────────────
  resolve(text: string): string {
    let out = text;
    for (const [token, val] of Object.entries(SAMPLE_DATA)) {
      out = out.replaceAll(token, val);
    }
    return out;
  }

  fieldDisplay(field: BillField): string {
    if (field.binding) return this.resolve(field.binding);
    return field.value || '';
  }

  fieldStyleObj(f: BillField): Record<string, string> {
    return {
      'font-size': f.fontSize + 'px',
      'font-weight': f.bold ? '700' : '400',
      'font-style': f.italic ? 'italic' : 'normal',
      'color': f.color,
      'text-align': f.align,
    };
  }

  sectionStyleObj(s: SectionStyle): Record<string, string> {
    return {
      'font-size': s.fontSize + 'px',
      'font-weight': s.bold ? '700' : '400',
      'font-style': s.italic ? 'italic' : 'normal',
      'text-align': s.align,
      'color': s.color,
      'background': s.background,
      'border-top': s.borderTop ? '1px solid #ddd' : 'none',
      'border-bottom': s.borderBottom ? '1px solid #ddd' : 'none',
      'padding-top': s.paddingTop + 'px',
      'padding-bottom': s.paddingBottom + 'px',
    };
  }

  visibleColumns(sec: BillSection): TableColumn[] {
    return (sec.columns || []).filter(c => c.visible);
  }

  // ── Template management ───────────────────────────────────────────────────
  loadTemplatesFromStorage(): void {
    try {
      const raw = localStorage.getItem('bill_templates');
      this.templates = raw ? JSON.parse(raw) : [];
    } catch { this.templates = []; }
  }

  saveTemplate(): void {
    if (!this.templateName.trim()) return;
    const t: BillTemplate = {
      id: makeId(),
      name: this.templateName,
      logoBase64: this.logoBase64,
      logoPosition: this.logoPosition,
      logoWidth: this.logoWidth,
      invoiceTitle: this.invoiceTitle,
      sections: JSON.parse(JSON.stringify(this.sections)),
      isDefault: this.templates.length === 0
    };
    const idx = this.templates.findIndex(x => x.name === this.templateName);
    if (idx > -1) { this.templates[idx] = t; } else { this.templates.push(t); }
    localStorage.setItem('bill_templates', JSON.stringify(this.templates));
    alert(`Template "${this.templateName}" saved!`);
  }

  loadTemplate(t: BillTemplate): void {
    this.templateName = t.name;
    this.logoBase64 = t.logoBase64;
    this.logoPosition = t.logoPosition;
    this.logoWidth = t.logoWidth || 80;
    this.invoiceTitle = t.invoiceTitle;
    this.sections = JSON.parse(JSON.stringify(t.sections));
    this.selectedSection = this.sections[0] || null;
  }

  setDefault(t: BillTemplate): void {
    this.templates.forEach(x => x.isDefault = false);
    t.isDefault = true;
    localStorage.setItem('bill_templates', JSON.stringify(this.templates));
  }

  deleteTemplate(t: BillTemplate): void {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    this.templates = this.templates.filter(x => x.id !== t.id);
    localStorage.setItem('bill_templates', JSON.stringify(this.templates));
  }

  printBill(): void { window.print(); }
}
