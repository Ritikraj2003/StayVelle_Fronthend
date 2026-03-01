import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private loaderService: LoaderService,
    private permissionService: PermissionService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.loaderService.show();

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (user) => {
          // User is already set in auth service during login
          this.notificationService.success('Login successful');
          this.isLoading = false;
          this.loaderService.hide();

          // Re-direct based on permissions
          const defaultRoute = this.permissionService.getDefaultRoute();
          this.router.navigate([defaultRoute]);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Invalid email or password. Please try again.';
          this.isLoading = false;
          this.loaderService.hide();
        }
      });
    }
  }
}

