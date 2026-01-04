import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';
import { PermissionService } from './permission.service';

export interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  action: string;
}

export interface User {
  userId: number;
  name: string;
  email: string;
  username: string;
  phone: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  imageUrl?: string | null; // User profile image
  permissions: Permission[];
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  constructor(
    private storageService: StorageService,
    private router: Router,
    private apiService: ApiService,
    private permissionService: PermissionService
  ) {
    this.loadUserFromStorage();
  }

  /**
   * Login using real API
   */
  login(email: string, password: string): Observable<User> {
    return this.apiService.post<any>('Login', { email, password }).pipe(
      map((response: any) => {
        if (response && response.userId) {
          const user: User = {
            userId: response.userId,
            name: response.name,
            email: response.email,
            username: response.username,
            phone: response.phone || '',
            roleId: response.roleId,
            roleName: response.roleName,
            isActive: response.isActive,
            isStaff: response.isStaff,
            isAdmin: response.isAdmin,
            imageUrl: response.imageUrl || response.ImageUrl || null,
            permissions: response.permissions || [],
            token: response.token
          };
          
          this.setUser(user, response.token);
          return user;
        } else {
          throw new Error('Invalid response from server');
        }
      }),
      catchError((error) => {
        const errorMessage = error?.error?.message || error?.message || 'Login failed. Please try again.';
        return throwError(() => ({ error: { message: errorMessage } }));
      })
    );
  }

  logout(): void {
    this.storageService.removeItem(this.TOKEN_KEY);
    this.storageService.removeItem(this.USER_KEY);
    this.permissionService.clearPermissions();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    const token = this.storageService.getItem<string>(this.TOKEN_KEY);
    return !!token;
  }

  getToken(): string | null {
    return this.storageService.getItem<string>(this.TOKEN_KEY);
  }

  setUser(user: User, token: string): void {
    this.storageService.setItem(this.TOKEN_KEY, token);
    this.storageService.setItem(this.USER_KEY, user);
    this.permissionService.setPermissions(user.permissions);
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getPermissions(): Permission[] {
    const user = this.getCurrentUser();
    return user?.permissions || [];
  }

  hasPermission(module: string, action: string): boolean {
    const permissions = this.getPermissions();
    return permissions.some(p => 
      p.module.toLowerCase() === module.toLowerCase() && 
      p.action.toLowerCase() === action.toLowerCase()
    );
  }

  hasAnyPermission(permissions: { module: string; action: string }[]): boolean {
    return permissions.some(p => this.hasPermission(p.module, p.action));
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.isAdmin || false;
  }

  isStaff(): boolean {
    const user = this.getCurrentUser();
    return user?.isStaff || false;
  }

  private loadUserFromStorage(): void {
    const user = this.storageService.getItem<User>(this.USER_KEY);
    if (user) {
      this.currentUserSubject.next(user);
    }
  }
}

