import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-qr-pin-validationpage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-pin-validationpage.component.html',
  styleUrl: './qr-pin-validationpage.component.css'
})
export class QrPinValidationpageComponent implements OnInit {
  token: string | null = null;
  isValidToken: boolean | null = null;
  roomData: any = null;
  pinCode: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validateToken(this.token);
      } else {
        this.isValidToken = false;
      }
    });
  }

  validateToken(token: string): void {
    this.apiService.getRoomByToken(token).subscribe({
      next: (data: any) => {
        if (data) {
          this.isValidToken = true;
          this.roomData = data;
        } else {
          this.isValidToken = false;
        }
      },
      error: (error) => {
        console.error('Error validating token:', error);
        this.isValidToken = false;
      }
    });
  }

  verifyCode(): void {
    if (!this.pinCode || !this.roomData) {
      alert('Please enter a valid PIN code.');
      return;
    }

    const requestData = {
      RoomId: this.roomData.id,
      AccessPin: this.pinCode
    };

    this.apiService.verifyBooking(requestData).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          // Redirect to homepage with the bookingId
          this.router.navigate(['/qr-room-page/homepage'], {
            queryParams: {
              bookingId: res.data.bookingId,
              roomId: this.roomData.roomId
            }
          });
        } else {
          alert(res.message || 'Invalid PIN or no active booking found.');
        }
      },
      error: (err: any) => {
        console.error('Error verifying booking:', err);
        alert('An error occurred while verifying. Please try again.');
      }
    });
  }

  callReception(): void {
    console.log('Calling reception...');
    // Implement call functionality if needed
  }
}
