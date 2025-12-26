import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  settingsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.settingsForm = this.fb.group({
      siteName: ['Stayvelle'],
      siteEmail: ['admin@stayvelle.com'],
      maintenanceMode: [false],
      allowRegistration: [true]
    });
  }

  onSubmit(): void {
    if (this.settingsForm.valid) {
      console.log('Settings saved:', this.settingsForm.value);
      // Static save - API calls will be added later
    }
  }
}

