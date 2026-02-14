import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrPinValidationpageComponent } from './qr-pin-validationpage.component';

describe('QrPinValidationpageComponent', () => {
  let component: QrPinValidationpageComponent;
  let fixture: ComponentFixture<QrPinValidationpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrPinValidationpageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QrPinValidationpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
