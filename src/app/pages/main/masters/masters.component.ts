import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.css'
})
export class MastersComponent implements OnInit {
  activeTab: string = 'room-master';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if there's a tab in the route
    this.route.firstChild?.url.subscribe(segments => {
      if (segments && segments.length > 0) {
        this.activeTab = segments[0].path;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.router.navigate([`/main/masters/${tab}`]);
  }
}

