import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdateServcieComponent } from './add-update-servcie.component';

describe('AddUpdateServcieComponent', () => {
  let component: AddUpdateServcieComponent;
  let fixture: ComponentFixture<AddUpdateServcieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUpdateServcieComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUpdateServcieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
