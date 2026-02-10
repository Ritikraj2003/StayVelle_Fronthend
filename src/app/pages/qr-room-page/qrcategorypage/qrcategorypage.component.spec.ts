import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRCategorypageComponent } from './qrcategorypage.component';

describe('QRCategorypageComponent', () => {
  let component: QRCategorypageComponent;
  let fixture: ComponentFixture<QRCategorypageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QRCategorypageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QRCategorypageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
