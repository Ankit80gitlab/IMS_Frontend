import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaConfigurationComponent } from './area-configuration.component';

describe('AreaConfigurationComponent', () => {
  let component: AreaConfigurationComponent;
  let fixture: ComponentFixture<AreaConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AreaConfigurationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AreaConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
