// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for opportunitiesListItem.
 */

import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { LazyLoadingComponent } from 'components/common-layout-directives/common-elements/lazy-loading.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { WrapTextWithEllipsisPipe } from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import { of } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';

import { ExplorationOpportunity, OpportunitiesListItemComponent } from './opportunities-list-item.component';
import { ContributorDashboardConstants } from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';

class MockWindowDimensionsService {
  getResizeEvent() {
    return of(new Event('resize'));
  }

  getWidth(): number {
    // Screen width of iPhone 12 Pro (to simulate a mobile viewport).
    return 390;
  }
}

describe('Opportunities List Item Component', () => {
  let component: OpportunitiesListItemComponent;
  let fixture: ComponentFixture<OpportunitiesListItemComponent>;
  let windowDimensionsService: MockWindowDimensionsService;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbTooltipModule
      ],
      declarations: [
        OpportunitiesListItemComponent,
        LazyLoadingComponent,
        WrapTextWithEllipsisPipe
      ],
      providers: [
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService
        }
      ],
    }).compileComponents().then(() => {
      fixture = TestBed.createComponent(
        OpportunitiesListItemComponent);
      component = fixture.componentInstance;
    });
  }));

  describe('when opportunity is provided', () => {
    beforeEach(() => {
      component.opportunity = {
        id: '1',
        labelText: 'Label text',
        labelColor: '#fff',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 50,
        translationsCount: 0
      };
      component.clickActionButton.emit =
        () => jasmine.createSpy('click', () => {});
      component.labelRequired = true;
      component.progressBarRequired = true;
      component.opportunityHeadingTruncationLength = 35;
      windowDimensionsService = TestBed.inject(WindowDimensionsService);
      fixture.detectChanges();
      component.ngOnInit();
    });

    it('should initialize $scope properties after controller is initialized',
      () => {
        const windowResizeSpy = spyOn(
          windowDimensionsService, 'getResizeEvent').and.callThrough();

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.opportunityDataIsLoading).toBe(false);
        expect(component.labelText).toBe('Label text');
        expect(component.labelStyle).toEqual({
          'background-color': '#fff'
        });
        expect(component.opportunityHeadingTruncationLength).toBe(35);
        expect(component.progressPercentage).toBe('50%');
        expect(component.progressBarStyle).toEqual({
          width: '50%'
        });
        expect(component.correspondingOpportunityDeleted).toBe(false);
        expect(windowResizeSpy).toHaveBeenCalled();
        expect(component.resizeSubscription).not.toBe(undefined);
        expect(component.onMobile).toBeTrue();
      });

    describe('when opportunity subheading corresponds to deleted ' +
      'opportunity', () => {
      beforeEach(() => {
        let opportunity = component.opportunity as ExplorationOpportunity;
        opportunity.subheading = (
          ContributorDashboardConstants
            .CORRESPONDING_DELETED_OPPORTUNITY_TEXT);
        fixture.detectChanges();
        component.ngOnInit();
      });

      it('should initialize correspondingOpportunityDeleted to true',
        () => {
          expect(component.correspondingOpportunityDeleted).toBe(true);
        });
    });
  });

  describe('when a translation opportunity is provided', () => {
    beforeEach(() => {
      component.opportunity = {
        id: '1',
        labelText: 'Label text',
        labelColor: '#fff',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 50,
        translationsCount: 25
      };
      component.opportunityType = 'translation';
      component.clickActionButton.emit =
        () => jasmine.createSpy('click', () => {});
      component.labelRequired = true;
      component.progressBarRequired = true;
      component.opportunityHeadingTruncationLength = 35;
      fixture.detectChanges();
      component.ngOnInit();
    });

    it('should initialize $scope properties after controller is initialized',
      () => {
        expect(component.opportunityDataIsLoading).toBe(false);
        expect(component.labelText).toBe('Label text');
        expect(component.labelStyle).toEqual({
          'background-color': '#fff'
        });
        expect(component.opportunityHeadingTruncationLength).toBe(35);
        expect(component.progressPercentage).toBe('50%');
        expect(component.correspondingOpportunityDeleted).toBe(false);
        expect(component.translationProgressBar).toBe(true);
        expect(component.cardsAvailable).toEqual(5);
      });

    describe('when opportunity subheading corresponds to deleted ' +
      'opportunity', () => {
      beforeEach(() => {
        let opportunity = component.opportunity as ExplorationOpportunity;
        opportunity.subheading = (
          ContributorDashboardConstants
            .CORRESPONDING_DELETED_OPPORTUNITY_TEXT);
        fixture.detectChanges();
        component.ngOnInit();
      });

      it('should initialize correspondingOpportunityDeleted to true',
        () => {
          expect(component.correspondingOpportunityDeleted).toBe(true);
        });
    });
  });

  describe('when opportunity is not provided', () => {
    beforeEach(() => {
      component.opportunityType = '';
      component.clickActionButton.emit =
        () => jasmine.createSpy('click', () => {});
      component.labelRequired = true;
      component.progressBarRequired = true;
      component.opportunityHeadingTruncationLength = 0;
      component.opportunityType = '';
      fixture.detectChanges();
      component.ngOnInit();
    });

    it('should initialize $scope properties after controller is initialized',
      () => {
        expect(component.opportunityDataIsLoading).toBeTrue();
        expect(component.labelText).toBeUndefined();
        expect(component.labelStyle).toBeUndefined();
        expect(component.opportunityHeadingTruncationLength).toBe(40);
        expect(component.correspondingOpportunityDeleted).toBeFalse();
      });
  });
});
