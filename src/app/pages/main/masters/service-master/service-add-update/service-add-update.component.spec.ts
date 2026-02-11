import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceAddUpdateComponent } from './service-add-update.component';

describe('ServiceAddUpdateComponent', () => {
  let component: ServiceAddUpdateComponent;
  let fixture: ComponentFixture<ServiceAddUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceAddUpdateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ServiceAddUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
