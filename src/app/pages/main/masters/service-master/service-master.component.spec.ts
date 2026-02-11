import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceMasterComponent } from './service-master.component';

describe('ServiceMasterComponent', () => {
  let component: ServiceMasterComponent;
  let fixture: ComponentFixture<ServiceMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ServiceMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
