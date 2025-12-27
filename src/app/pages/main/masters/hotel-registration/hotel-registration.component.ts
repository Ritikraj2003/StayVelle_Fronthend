import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hotel-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './hotel-registration.component.html',
  styleUrl: './hotel-registration.component.css'
})
export class HotelRegistrationComponent implements OnInit {

  constructor() {}

  ngOnInit(): void {
  }
}

