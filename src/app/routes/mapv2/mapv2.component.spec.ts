import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mapv2Component } from './mapv2.component';

describe('Mapv2Component', () => {
  let component: Mapv2Component;
  let fixture: ComponentFixture<Mapv2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mapv2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Mapv2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
