import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductIncidentTypeComponent } from './product-incident-type.component';

describe('ProductIncidentTypeComponent', () => {
  let component: ProductIncidentTypeComponent;
  let fixture: ComponentFixture<ProductIncidentTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductIncidentTypeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductIncidentTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
