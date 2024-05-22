import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAreaConfirmDialogComponent } from './create-area-confirm-dialog.component';

describe('CreateAreaConfirmDialogComponent', () => {
  let component: CreateAreaConfirmDialogComponent;
  let fixture: ComponentFixture<CreateAreaConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAreaConfirmDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateAreaConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
