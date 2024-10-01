import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceConfigurationComponent } from './device-configuration.component';

describe('DeviceConfigurationComponent', () => {
  let component: DeviceConfigurationComponent;
  let fixture: ComponentFixture<DeviceConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceConfigurationComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DeviceConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
