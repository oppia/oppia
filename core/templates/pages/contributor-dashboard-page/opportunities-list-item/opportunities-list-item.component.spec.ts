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

import { ExplorationOpportunity, OpportunitiesListItemComponent } from './opportunities-list-item.component';
import { ContributorDashboardConstants } from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';

describe('Opportunities List Item Component', () => {
  let component: OpportunitiesListItemComponent;
  let fixture: ComponentFixture<OpportunitiesListItemComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbTooltipModule
      ],
      declarations: [
        OpportunitiesListItemComponent,
        LazyLoadingComponent,
        WrapTextWithEllipsisPipe
      ]
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
        expect(component.progressBarStyle).toEqual({
          width: '50%'
        });
        expect(component.correspondingOpportunityDeleted).toBe(false);
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
      component.opportunity = undefined;
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
