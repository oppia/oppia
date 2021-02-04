import { ComponentFixture, TestBed } from '@angular/core/testing';

import { oppiaAdminProdModeActivitiesTabComponent } from
 './admin-prod-mode-activities-tab.component';

 describe('oppiaAdminProdModeActivitiesTabComponent (minimal)', () => {
    it('should create', () => {
      TestBed.configureTestingModule({declarations: [oppiaAdminProdModeActivitiesTabComponent]});
      const fixture = TestBed.createComponent(oppiaAdminProdModeActivitiesTabComponent);
      const component = fixture.componentInstance;
      expect(component).toBeDefined();
    });
  });