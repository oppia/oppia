import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPlatformParametersTabComponent } from './admin-platform-parameters-tab.component';

describe('AdminPlatformParametersTabComponent', () => {
  let component: AdminPlatformParametersTabComponent;
  let fixture: ComponentFixture<AdminPlatformParametersTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminPlatformParametersTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPlatformParametersTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
