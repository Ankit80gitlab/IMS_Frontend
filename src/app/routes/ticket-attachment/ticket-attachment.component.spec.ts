import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketAttachmentComponent } from './ticket-attachment.component';

describe('TicketAttachmentComponent', () => {
  let component: TicketAttachmentComponent;
  let fixture: ComponentFixture<TicketAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketAttachmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TicketAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
