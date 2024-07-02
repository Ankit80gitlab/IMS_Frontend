import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerUsersManagementComponent } from './customer-users-management.component';

describe('CustomerUsersManagementComponent', () => {
  let component: CustomerUsersManagementComponent;
  let fixture: ComponentFixture<CustomerUsersManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerUsersManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomerUsersManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
