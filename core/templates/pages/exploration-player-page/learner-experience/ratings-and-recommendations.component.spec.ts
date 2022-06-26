// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ratings and recommendations component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserService } from 'services/user.service';
import { LearnerViewRatingService } from '../services/learner-view-rating.service';
import { MockLimitToPipe } from '../templates/information-card-modal.component.spec';
import { RatingsAndRecommendationsComponent } from './ratings-and-recommendations.component';
import { ExplorationPlayerStateService } from './../services/exploration-player-state.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { LocalStorageService } from 'services/local-storage.service';

class MockPlatformFeatureService {
  get status(): object {
    return {
      EndChapterCelebration: {
        isEnabled: true
      }
    };
  }
}

describe('Ratings and recommendations component', () => {
  let fixture: ComponentFixture<RatingsAndRecommendationsComponent>;
  let componentInstance: RatingsAndRecommendationsComponent;
  let alertsService: AlertsService;
  let learnerViewRatingService: LearnerViewRatingService;
  let urlService: UrlService;
  let userService: UserService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let urlInterpolationService: UrlInterpolationService;
  let platformFeatureService: PlatformFeatureService;
  let localStorageService: LocalStorageService;

  const mockNgbPopover = jasmine.createSpyObj(
    'NgbPopover', ['close', 'toggle']);


  class MockWindowRef {
    nativeWindow = {
      location: {
        search: '',
        pathname: '/path/name',
        reload: () => {}
      }
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgbPopoverModule
      ],
      declarations: [
        RatingsAndRecommendationsComponent,
        MockLimitToPipe
      ],
      providers: [
        AlertsService,
        LearnerViewRatingService,
        UrlService,
        UserService,
        ExplorationPlayerStateService,
        UrlInterpolationService,
        LocalStorageService,
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingsAndRecommendationsComponent);
    componentInstance = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    learnerViewRatingService = TestBed.inject(LearnerViewRatingService);
    urlService = TestBed.inject(UrlService);
    userService = TestBed.inject(UserService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    localStorageService = TestBed.inject(LocalStorageService);
  });

  it('should populate internal properties and subscribe to event' +
    ' listeners on initialize', fakeAsync(() => {
    const collectionId = 'collection_id';
    const userRating = 5;
    const mockOnRatingUpdated = new EventEmitter<void>();

    expect(componentInstance.inStoryMode).toBe(undefined);
    expect(componentInstance.storyViewerUrl).toBe(undefined);

    spyOn(urlService, 'getCollectionIdFromExplorationUrl').and.returnValue(
      collectionId);
    spyOn(learnerViewRatingService, 'getUserRating').and.returnValue(
      userRating);
    spyOn(alertsService, 'addSuccessMessage');
    spyOn(learnerViewRatingService, 'init').and.callFake(
      (callb: (rating: number) => void) => {
        callb(userRating);
      });
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(true);
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      'dummy_story_viewer_page_url');
    spyOnProperty(learnerViewRatingService, 'onRatingUpdated').and.returnValue(
      mockOnRatingUpdated);

    componentInstance.questionPlayerConfig = null;

    componentInstance.ngOnInit();
    mockOnRatingUpdated.emit();
    tick();

    expect(explorationPlayerStateService.isInStoryChapterMode)
      .toHaveBeenCalled();
    expect(componentInstance.inStoryMode).toBe(true);
    expect(urlInterpolationService.interpolateUrl).toHaveBeenCalled();
    expect(componentInstance.storyViewerUrl).toBe(
      'dummy_story_viewer_page_url');
    expect(componentInstance.userRating).toEqual(userRating);
    expect(alertsService.addSuccessMessage).toHaveBeenCalled();
    expect(learnerViewRatingService.getUserRating).toHaveBeenCalled();
    expect(componentInstance.collectionId).toEqual(collectionId);
  }));

  it('should not generate story page url if not in story mode',
    fakeAsync(() => {
      expect(componentInstance.inStoryMode).toBe(undefined);
      expect(componentInstance.storyViewerUrl).toBe(undefined);

      spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
        .and.returnValue(false);
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
        'dummy_story_viewer_page_url');

      componentInstance.ngOnInit();
      tick();

      expect(explorationPlayerStateService.isInStoryChapterMode)
        .toHaveBeenCalled();
      expect(componentInstance.inStoryMode).toBe(false);
      expect(urlInterpolationService.interpolateUrl).not.toHaveBeenCalled();
      expect(componentInstance.storyViewerUrl).toBe(undefined);
    }));

  it('should toggle popover when user clicks on rating stars', () => {
    componentInstance.feedbackPopOver = mockNgbPopover;

    componentInstance.togglePopover();

    // Using feedback popover directly here breaks the principle of
    // independent unit tests. Hence, mock is used here.
    // The mock doesn't allow us to check its final state.
    // So, using a spy on function toggle instead.
    expect(componentInstance.feedbackPopOver.toggle).toHaveBeenCalled();
  });

  it('should close popover when user clicks on cancel button', () => {
    componentInstance.feedbackPopOver = mockNgbPopover;

    componentInstance.closePopover();

    // Using feedback popover directly here breaks the principle of
    // independent unit tests. Hence, mock is used here.
    // The mock doesn't allow us to check its final state.
    // So, using a spy on function toggle instead.
    expect(componentInstance.feedbackPopOver.close).toHaveBeenCalled();
  });

  it('should submit user rating when user clicks on rating star', () => {
    spyOn(learnerViewRatingService, 'submitUserRating');
    const userRating = 5;

    componentInstance.submitUserRating(userRating);

    expect(learnerViewRatingService.submitUserRating).toHaveBeenCalledWith(
      userRating);
  });

  it('should redirect to sign in page when user clicks on signin button',
    fakeAsync(() => {
      spyOn(userService, 'getLoginUrlAsync').and.returnValue(
        Promise.resolve('login_url'));

      componentInstance.signIn();
      tick();

      expect(userService.getLoginUrlAsync).toHaveBeenCalled();
    }));

  it('should reload the page if user clicks on signin button and ' +
    'login url is not available', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve(''));

    componentInstance.signIn();
    tick();

    expect(userService.getLoginUrlAsync).toHaveBeenCalled();
  }));

  it('should save user\'s sign up section preference to localStorage', () => {
    spyOn(localStorageService, 'updateEndChapterSignUpSectionHiddenPreference');

    componentInstance.hideSignUpSection();

    expect(localStorageService.updateEndChapterSignUpSectionHiddenPreference)
      .toHaveBeenCalledWith('true');
  });

  it('should get user\'s sign up section preference from localStorage', () => {
    const getPreferenceSpy = (
      spyOn(localStorageService, 'getEndChapterSignUpSectionHiddenPreference')
        .and.returnValue('true'));

    expect(componentInstance.isSignUpSectionHidden()).toBe(true);
    expect(localStorageService.getEndChapterSignUpSectionHiddenPreference)
      .toHaveBeenCalled();

    getPreferenceSpy.and.returnValue(null);

    expect(componentInstance.isSignUpSectionHidden()).toBe(false);
  });

  it('should correctly determine if the feature is enabled or not', () => {
    const featureSpy = (
      spyOnProperty(platformFeatureService, 'status', 'get').and.callThrough());

    expect(componentInstance.isEndChapterFeatureEnabled()).toBe(true);

    featureSpy.and.returnValue(
      {
        EndChapterCelebration: {
          isEnabled: false
        }
      }
    );

    expect(componentInstance.isEndChapterFeatureEnabled()).toBe(false);
  });
});
