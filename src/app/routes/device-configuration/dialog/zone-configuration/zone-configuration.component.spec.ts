import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneConfigurationComponent } from './zone-configuration.component';

describe('ZoneConfigurationComponent', () => {
  let component: ZoneConfigurationComponent;
  let fixture: ComponentFixture<ZoneConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneConfigurationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ZoneConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
