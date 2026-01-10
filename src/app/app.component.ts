import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoaderService } from './core/services/loader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Stayvelle';
  isLoading: boolean = false;
  private subscription?: Subscription;

  constructor(private loaderService: LoaderService) {}

  ngOnInit(): void {
    this.subscription = this.loaderService.isLoading$.subscribe(
      (loading) => {
        this.isLoading = loading;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
