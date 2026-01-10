import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private toastr: ToastrService) { }

  /**
   * Show success notification
   * @param message - The message to display
   * @param title - Optional title for the notification
   */
  success(message: string, title?: string): void {
    this.toastr.success(message, title || 'Success', {
      timeOut: 3000,
      positionClass: 'toast-top-center',
      closeButton: true,
      progressBar: true
    });
  }

  /**
   * Show warning notification
   * @param message - The message to display
   * @param title - Optional title for the notification
   */
  warning(message: string, title?: string): void {
    this.toastr.warning(message, title || 'Warning', {
      timeOut: 4000,
      positionClass: 'toast-top-center',
      closeButton: true,
      progressBar: true
    });
  }

  /**
   * Show error notification
   * @param message - The message to display
   * @param title - Optional title for the notification
   */
  error(message: string, title?: string): void {
    this.toastr.error(message, title || 'Error', {
      timeOut: 5000,
      positionClass: 'toast-top-center',
      closeButton: true,
      progressBar: true
    });
  }

  /**
   * Show info notification
   * @param message - The message to display
   * @param title - Optional title for the notification
   */
  info(message: string, title?: string): void {
    this.toastr.info(message, title || 'Info', {
      timeOut: 3000,
      positionClass: 'toast-top-center',
      closeButton: true,
      progressBar: true
    });
  }
}

