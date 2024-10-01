import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketIncidentTypeComponent } from './ticket-incident-type.component';

describe('TicketIncidentTypeComponent', () => {
  let component: TicketIncidentTypeComponent;
  let fixture: ComponentFixture<TicketIncidentTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketIncidentTypeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TicketIncidentTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
