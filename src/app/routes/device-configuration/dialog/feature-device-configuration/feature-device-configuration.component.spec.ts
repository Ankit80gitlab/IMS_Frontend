import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureDeviceConfigurationComponent } from './feature-device-configuration.component';

describe('FeatureDeviceConfigurationComponent', () => {
  let component: FeatureDeviceConfigurationComponent;
  let fixture: ComponentFixture<FeatureDeviceConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureDeviceConfigurationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FeatureDeviceConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
