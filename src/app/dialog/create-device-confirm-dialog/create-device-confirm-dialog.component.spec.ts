import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDeviceConfirmDialogComponent } from './create-device-confirm-dialog.component';

describe('CreateDeviceConfirmDialogComponent', () => {
  let component: CreateDeviceConfirmDialogComponent;
  let fixture: ComponentFixture<CreateDeviceConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDeviceConfirmDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateDeviceConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
