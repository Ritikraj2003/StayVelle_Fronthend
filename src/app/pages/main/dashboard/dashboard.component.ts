import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  stats = [
    { label: 'Total Users', value: '1,234', icon: '👥', color: '#3498db' },
    { label: 'Active Sessions', value: '456', icon: '🟢', color: '#2ecc71' },
    { label: 'Revenue', value: '$12,345', icon: '💰', color: '#f39c12' },
    { label: 'Orders', value: '789', icon: '📦', color: '#e74c3c' }
  ];
}

