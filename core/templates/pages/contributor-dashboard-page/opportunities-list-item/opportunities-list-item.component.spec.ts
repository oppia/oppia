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

import {ComponentFixture, fakeAsync, TestBed} from '@angular/core/testing';
import {LazyLoadingComponent} from 'components/common-layout-directives/common-elements/lazy-loading.component';
import {NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {WrapTextWithEllipsisPipe} from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import {of} from 'rxjs';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {SimpleChange} from '@angular/core';

import {
  ExplorationOpportunity,
  OpportunitiesListItemComponent,
} from './opportunities-list-item.component';
import {ContributorDashboardConstants} from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import {MatIconModule} from '@angular/material/icon';

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
      imports: [NgbTooltipModule, MatIconModule],
      declarations: [
        OpportunitiesListItemComponent,
        LazyLoadingComponent,
        WrapTextWithEllipsisPipe,
      ],
      providers: [
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(OpportunitiesListItemComponent);
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
        translationsCount: 0,
        topicName: 'Topic 1',
      };
      component.clickActionButton.emit = () =>
        jasmine.createSpy('click', () => {});
      component.labelRequired = true;
      component.progressBarRequired = true;
      component.opportunityHeadingTruncationLength = 35;
      windowDimensionsService = TestBed.inject(WindowDimensionsService);
      fixture.detectChanges();
      component.ngOnInit();
    });

    it('should initialize component properties after component is initialized', () => {
      const windowResizeSpy = spyOn(
        windowDimensionsService,
        'getResizeEvent'
      ).and.callThrough();

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.opportunityDataIsLoading).toBe(false);
      expect(component.labelText).toBe('Label text');
      expect(component.labelStyle).toEqual({
        'background-color': '#fff',
      });
      expect(component.opportunityHeadingTruncationLength).toBe(35);
      expect(component.progressPercentage).toBe('50%');
      expect(component.progressBarStyle).toEqual({
        width: '50%',
      });
      expect(component.correspondingOpportunityDeleted).toBe(false);
      expect(windowResizeSpy).toHaveBeenCalled();
      expect(component.resizeSubscription).not.toBe(undefined);
      expect(component.onMobile).toBeTrue();
    });

    describe(
      'when opportunity subheading corresponds to deleted ' + 'opportunity',
      () => {
        beforeEach(() => {
          let opportunity = component.opportunity as ExplorationOpportunity;
          opportunity.subheading =
            ContributorDashboardConstants.CORRESPONDING_DELETED_OPPORTUNITY_TEXT;
          fixture.detectChanges();
          component.ngOnInit();
        });

        it('should initialize correspondingOpportunityDeleted to true', () => {
          expect(component.correspondingOpportunityDeleted).toBe(true);
        });
      }
    );

    describe('when progress percentage is zero', () => {
      beforeEach(() => {
        let opportunity = component.opportunity as ExplorationOpportunity;
        opportunity.progressPercentage = 0;
        fixture.detectChanges();
        component.ngOnInit();
      });

      it('should initialize progressPercentage to 0%', () => {
        expect(component.progressPercentage).toBe('0%');
      });

      it('should not set progressPercentage if it is undefined', () => {
        let opportunity = component.opportunity as ExplorationOpportunity;
        Object.defineProperty(opportunity, 'progressPercentage', {
          value: undefined,
        });
        component.progressPercentage = 'default';
        fixture.detectChanges();
        component.ngOnInit();
        expect(component.progressPercentage).toBe('default');
      });

      it('should not set progressPercentage if it is null', () => {
        let opportunity = component.opportunity as ExplorationOpportunity;
        Object.defineProperty(opportunity, 'progressPercentage', {
          value: null,
        });
        component.progressPercentage = 'default';
        fixture.detectChanges();
        component.ngOnInit();
        expect(component.progressPercentage).toBe('default');
      });

      it('should initialize progressBarStyle to 0%', () => {
        expect(component.progressBarStyle).toEqual({
          width: '0%',
        });
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
        translationsCount: 25,
        topicName: 'Topic 1',
      };
      component.opportunityType = 'translation';
      component.clickActionButton.emit = () =>
        jasmine.createSpy('click', () => {});
      component.labelRequired = true;
      component.progressBarRequired = true;
      component.opportunityHeadingTruncationLength = 35;
      fixture.detectChanges();
      component.ngOnInit();
    });

    it('should initialize component properties after component is initialized', () => {
      expect(component.opportunityDataIsLoading).toBe(false);
      expect(component.labelText).toBe('Label text');
      expect(component.labelStyle).toEqual({
        'background-color': '#fff',
      });
      expect(component.opportunityHeadingTruncationLength).toBe(35);
      expect(component.progressPercentage).toBe('50%');
      expect(component.correspondingOpportunityDeleted).toBe(false);
      expect(component.translationProgressBar).toBe(true);
      expect(component.cardsAvailable).toEqual(5);
    });

    describe(
      'when opportunity subheading corresponds to deleted ' + 'opportunity',
      () => {
        beforeEach(() => {
          let opportunity = component.opportunity as ExplorationOpportunity;
          opportunity.subheading =
            ContributorDashboardConstants.CORRESPONDING_DELETED_OPPORTUNITY_TEXT;
          fixture.detectChanges();
          component.ngOnInit();
        });

        it('should initialize correspondingOpportunityDeleted to true', () => {
          expect(component.correspondingOpportunityDeleted).toBe(true);
        });
      }
    );
  });

  describe('when opportunity is not provided', () => {
    beforeEach(() => {
      component.opportunityType = '';
      component.clickActionButton.emit = () =>
        jasmine.createSpy('click', () => {});
      component.labelRequired = true;
      component.progressBarRequired = true;
      component.opportunityHeadingTruncationLength = 0;
      component.opportunityType = '';
      fixture.detectChanges();
      component.ngOnInit();
    });

    it('should initialize component properties after component is initialized', () => {
      expect(component.opportunityDataIsLoading).toBeTrue();
      expect(component.labelText).toBeUndefined();
      expect(component.labelStyle).toBeUndefined();
      expect(component.opportunityHeadingTruncationLength).toBe(40);
      expect(component.correspondingOpportunityDeleted).toBeFalse();
    });
  });

  describe('when reviewable translation suggestions are provided', () => {
    beforeEach(() => {
      component.opportunity = {
        id: '1',
        labelText: 'Label text',
        labelColor: '#fff',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 50,
        translationsCount: 25,
        translationWordCount: 13,
        topicName: 'Topic 1',
      };
      component.opportunityType = 'translation';
      component.clickActionButton.emit = () =>
        jasmine.createSpy('click', () => {});
      component.labelRequired = true;
      component.opportunityHeadingTruncationLength = 35;
      fixture.detectChanges();
      component.ngOnInit();
    });

    it(
      'should show short label for translation suggestions with' +
        ' word count less than 20',
      () => {
        const bannerElement: HTMLElement = fixture.nativeElement;
        const translationLengthLabel = bannerElement.querySelector(
          '.oppia-translation-length-label'
        );

        expect(translationLengthLabel).toBeTruthy();
        expect(translationLengthLabel?.textContent).toContain(
          'Short Translation'
        );
      }
    );

    it(
      'should not show length label for translation suggestions with word' +
        ' count more than 20',
      () => {
        component.opportunity.translationWordCount = 25;
        fixture.detectChanges();

        const bannerElement: HTMLElement = fixture.nativeElement;
        const translationLengthLabel = bannerElement.querySelector(
          '.oppia-translation-length-label'
        );

        expect(translationLengthLabel).toBeNull();
      }
    );

    it('should emit a pin event with the correct properties', () => {
      const spy = spyOn(component.clickPinButton, 'emit');
      const expectedPayload = {
        topic_name: 'Topic 1',
        exploration_id: '1',
      };

      component.opportunity = {
        id: '1',
        labelText: 'Label text',
        labelColor: '#fff',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 50,
        translationsCount: 25,
        translationWordCount: 13,
        topicName: 'Topic 1',
      };
      component.pinOpportunity();

      expect(spy).toHaveBeenCalledWith(expectedPayload);
    });

    it('should emit an unpin event with the correct properties', () => {
      const spy = spyOn(component.clickUnpinButton, 'emit');
      const expectedTopicName = 'Topic 1';

      component.opportunity = {
        id: '1',
        labelText: 'Label text',
        labelColor: '#fff',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 50,
        translationsCount: 25,
        translationWordCount: 13,
        topicName: 'Topic 1',
      };
      component.unpinOpportunity();

      expect(spy).toHaveBeenCalledWith({
        topic_name: expectedTopicName,
        exploration_id: '1',
      });
    });

    describe('when all remaining content is reviewer-only', () => {
      beforeEach(() => {
        let opportunity = component.opportunity as ExplorationOpportunity;
        opportunity.totalCount = 10;
        opportunity.translationsCount = 5;
        opportunity.inReviewCount = 3;
        opportunity.reviewerOnlyContentCount = 2;
        opportunity.userIsReviewer = false;
        fixture.detectChanges();
        component.ngOnInit();
      });

      it('should calculate cardsAvailable correctly', () => {
        expect(component.cardsAvailable).toBe(2);
      });

      it('should disable the button and show the correct generic tooltip', () => {
        expect(component.opportunityButtonDisabled).toBe(true);
        expect(component.tooltipText).toBe(
          'There are no more cards available for translation. The remaining cards require reviewer privileges to translate.'
        );
      });
    });

    describe('when totalCount is 0', () => {
      beforeEach(() => {
        let opportunity = component.opportunity as ExplorationOpportunity;
        opportunity.totalCount = 0;
        opportunity.translationsCount = 0;
        opportunity.inReviewCount = 0;
        opportunity.reviewerOnlyContentCount = 0;
        opportunity.userIsReviewer = false;
        fixture.detectChanges();
        component.ngOnInit();
      });

      it('should set progressPercentage to 100% to avoid division by zero', () => {
        expect(component.progressPercentage).toBe('100%');
        expect(component.cardsAvailable).toBe(0);
      });
    });

    describe('when button is disabled and there is no reviewer-only content', () => {
      beforeEach(() => {
        let opportunity = component.opportunity as ExplorationOpportunity;
        opportunity.totalCount = 10;
        opportunity.translationsCount = 5;
        opportunity.inReviewCount = 5;
        opportunity.reviewerOnlyContentCount = 0;
        opportunity.userIsReviewer = false;
        fixture.detectChanges();
        component.ngOnInit();
      });

      it('should disable the button and show the default tooltip when all translations are in review', () => {
        expect(component.opportunityButtonDisabled).toBe(true);
        expect(component.tooltipText).toBe(
          'All available translations are currently in review.'
        );
      });
    });

    describe('when button is disabled and user is a reviewer', () => {
      beforeEach(() => {
        let opportunity = component.opportunity as ExplorationOpportunity;
        opportunity.totalCount = 10;
        opportunity.translationsCount = 5;
        opportunity.inReviewCount = 5;
        opportunity.reviewerOnlyContentCount = 5;
        opportunity.userIsReviewer = true;
        fixture.detectChanges();
        component.ngOnInit();
      });

      it('should show the default tooltip because reviewer can still review', () => {
        expect(component.opportunityButtonDisabled).toBe(true);
        expect(component.tooltipText).toBe(
          'All available translations are currently in review.'
        );
      });
    });

    describe('when button is disabled and reviewerOnlyContentCount is undefined', () => {
      beforeEach(() => {
        let opportunity = component.opportunity as ExplorationOpportunity;
        opportunity.totalCount = 10;
        opportunity.translationsCount = 5;
        opportunity.inReviewCount = 5;
        opportunity.reviewerOnlyContentCount = undefined;
        opportunity.userIsReviewer = false;
        fixture.detectChanges();
        component.ngOnInit();
      });

      it('should show the default tooltip when reviewer count is not present', () => {
        expect(component.opportunityButtonDisabled).toBe(true);
        expect(component.tooltipText).toBe(
          'All available translations are currently in review.'
        );
      });
    });

    describe('ngOnChanges', () => {
      it('should call initOpportunityData when opportunity changes', () => {
        spyOn(component, 'initOpportunityData');
        component.ngOnChanges({
          opportunity: new SimpleChange(null, 'new value', false),
        });
        expect(component.initOpportunityData).toHaveBeenCalled();
      });

      it('should not call initOpportunityData when opportunity does not change', () => {
        spyOn(component, 'initOpportunityData');
        component.ngOnChanges({
          otherProperty: new SimpleChange(null, 'new value', false),
        });
        expect(component.initOpportunityData).not.toHaveBeenCalled();
      });
    });
  });
});
