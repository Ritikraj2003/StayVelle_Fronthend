import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillmasterComponent } from './billmaster.component';

describe('BillmasterComponent', () => {
  let component: BillmasterComponent;
  let fixture: ComponentFixture<BillmasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillmasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BillmasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
