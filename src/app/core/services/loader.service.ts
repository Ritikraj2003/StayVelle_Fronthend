import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  constructor() { }

  /**
   * Show the global loader
   */
  show(): void {
    this.isLoadingSubject.next(true);
  }

  /**
   * Hide the global loader
   */
  hide(): void {
    this.isLoadingSubject.next(false);
  }

  /**
   * Get current loading state
   */
  get isLoading(): boolean {
    return this.isLoadingSubject.value;
  }
}

