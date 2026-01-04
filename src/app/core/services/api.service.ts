import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params });
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data);
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`);
  }

  ///////////////////////////////
  // User APIs
  getUsers() : Observable<any>{
    return this.http.get<any>(`${this.apiUrl}/Users`) as Observable<any>;
  }

  getUserById(id: number): Observable<any> {
    return this.get<any>(`Users/${id}`);
  }

  createUser(data: any) : Observable<any> {
    return this.post<any>('Users', data);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.put<any>(`Users/${id}`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.delete<any>(`Users/${id}`);
  }

  ///////////////////////////////
  // Role APIs
  getRoles(search?: string): Observable<any> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.get<any>('Role', params);
  }

  getRoleById(id: number): Observable<any> {
    return this.get<any>(`Role/${id}`);
  }

  createRole(data: any): Observable<any> {
    return this.post<any>('Role', data);
  }

  updateRole(id: number, data: any): Observable<any> {
    return this.put<any>(`Role/${id}`, data);
  }

  deleteRole(id: number): Observable<any> {
    return this.delete<any>(`Role/${id}`);
  }

  ///////////////////////////////
  // Permission APIs
  getPermissions(search?: string): Observable<any> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.get<any>('Permission', params);
  }

  getPermissionById(id: number): Observable<any> {
    return this.get<any>(`Permission/${id}`);
  }

  getPermissionsByRole(roleId: number): Observable<any> {
    return this.get<any>(`Permission/role/${roleId}`);
  }

  createPermission(data: any): Observable<any> {
    return this.post<any>('Permission', data);
  }

  updatePermission(id: number, data: any): Observable<any> {
    return this.put<any>(`Permission/${id}`, data);
  }

  deletePermission(id: number): Observable<any> {
    return this.delete<any>(`Permission/${id}`);
  }

  ///////////////////////////////
  // Room APIs
  getRooms(): Observable<any> {
    return this.get<any>('Room');
  }

  getRoomById(id: number): Observable<any> {
    return this.get<any>(`Room/${id}`);
  }

  getRoomByRoomNumber(roomNumber: string): Observable<any> {
    return this.get<any>(`Room/roomnumber/${roomNumber}`);
  }

  getRoomsByStatus(status: string): Observable<any> {
    return this.get<any>(`Room/status/${status}`);
  }

  getRoomsByType(roomType: string): Observable<any> {
    return this.get<any>(`Room/type/${roomType}`);
  }

  createRoom(data: any): Observable<any> {
    return this.post<any>('Room', data);
  }

  updateRoom(id: number, data: any): Observable<any> {
    return this.put<any>(`Room/${id}`, data);
  }

  deleteRoom(id: number): Observable<any> {
    return this.delete<any>(`Room/${id}`);
  }

  hardDeleteRoom(id: number): Observable<any> {
    return this.delete<any>(`Room/${id}/hard`);
  }

  ///////////////////////////////
  // Booking APIs
  getBookings(): Observable<any> {
    return this.get<any>('Booking');
  }

  getBookingById(id: number): Observable<any> {
    return this.get<any>(`Booking/${id}`);
  }

  getBookingByGuestId(guestId: number): Observable<any> {
    return this.get<any>(`Booking/guest/${guestId}`);
  }

  getBookingByGuestPhone(phoneNumber: string): Observable<any> {
    return this.get<any>(`Booking/phone/${phoneNumber}`);
  }

  createBooking(data: any): Observable<any> {
    return this.post<any>('Booking', data);
  }

  updateBooking(id: number, data: any): Observable<any> {
    return this.put<any>(`Booking/${id}`, data);
  }

  deleteBooking(id: number): Observable<any> {
    return this.delete<any>(`Booking/${id}`);
  }

  checkInBooking(id: number): Observable<any> {
    return this.post<any>(`Booking/${id}/checkin`, {});
  }

  checkOutBooking(id: number): Observable<any> {
    return this.post<any>(`Booking/${id}/checkout`, {});
  }

  ///////////////////////////////
  // Housekeeping Task APIs
  getHousekeepingTasks(): Observable<any> {
    return this.get<any>('HousekeepingTask');
  }

  getHousekeepingTaskById(id: number): Observable<any> {
    return this.get<any>(`HousekeepingTask/${id}`);
  }

  getHousekeepingTaskByBookingId(bookingId: number): Observable<any> {
    return this.get<any>(`HousekeepingTask/booking/${bookingId}`);
  }

  createHousekeepingTask(data: any): Observable<any> {
    return this.post<any>('HousekeepingTask', data);
  }

  updateHousekeepingTask(id: number, data: any): Observable<any> {
    return this.put<any>(`HousekeepingTask/${id}`, data);
  }

  deleteHousekeepingTask(id: number): Observable<any> {
    return this.delete<any>(`HousekeepingTask/${id}`);
  }
}

