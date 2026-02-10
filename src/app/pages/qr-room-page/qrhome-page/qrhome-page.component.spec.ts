import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRHomePageComponent } from './qrhome-page.component';

describe('QRHomePageComponent', () => {
  let component: QRHomePageComponent;
  let fixture: ComponentFixture<QRHomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QRHomePageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QRHomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
