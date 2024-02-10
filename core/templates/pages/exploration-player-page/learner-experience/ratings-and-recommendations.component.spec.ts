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
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserService } from 'services/user.service';
import { LearnerViewRatingService } from '../services/learner-view-rating.service';
import { MockLimitToPipe } from 'pages/exploration-player-page/templates/lesson-information-card-modal.component.spec';
import { RatingsAndRecommendationsComponent } from './ratings-and-recommendations.component';
import { ExplorationPlayerStateService } from './../services/exploration-player-state.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { LocalStorageService } from 'services/local-storage.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { TopicViewerBackendApiService } from 'domain/topic_viewer/topic-viewer-backend-api.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { ReadOnlyStoryNode } from 'domain/story_viewer/read-only-story-node.model';
import { ReadOnlyTopic } from 'domain/topic_viewer/read-only-topic-object.factory';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { FeatureStatusChecker } from 'domain/feature-flag/feature-status-summary.model';

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
  let assetsBackendApiService: AssetsBackendApiService;
  let storyViewerBackendApiService: StoryViewerBackendApiService;
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let siteAnalyticsService: SiteAnalyticsService;

  const mockNgbPopover = jasmine.createSpyObj(
    'NgbPopover', ['close', 'toggle', 'open']);


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
        AssetsBackendApiService,
        StoryViewerBackendApiService,
        TopicViewerBackendApiService,
        LocalStorageService,
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
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
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    storyViewerBackendApiService = TestBed.inject(
      StoryViewerBackendApiService);
    topicViewerBackendApiService = TestBed.inject(
      TopicViewerBackendApiService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  it('should populate internal properties and subscribe to event' +
    ' listeners on initialize', fakeAsync(() => {
    const collectionId = 'collection_id';
    const userRating = 5;
    const mockOnRatingUpdated = new EventEmitter<void>();
    const readOnlyStoryNode1 = new ReadOnlyStoryNode(
      'node_1', '', '', [], [], [], '', false, '',
      {} as LearnerExplorationSummary, false, 'bg_color_1', 'filename_1');
    const readOnlyStoryNode2 = new ReadOnlyStoryNode(
      'node_2', '', '', [], [], [], '', false, '',
      {} as LearnerExplorationSummary, false, 'bg_color_2', 'filename_2');

    expect(componentInstance.inStoryMode).toBe(undefined);
    expect(componentInstance.storyViewerUrl).toBe(undefined);
    expect(componentInstance.practiceQuestionsAreEnabled).toBe(false);

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
    spyOn(componentInstance, 'getIconUrl').and.returnValue('thumbnail_url');
    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_url_fragment: 'story_url_fragment',
      topic_url_fragment: 'topic_url_fragment',
      classroom_url_fragment: 'classroom_url_fragment',
      node_id: 'node_1'
    });
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(new StoryPlaythrough(
        'story_id', [readOnlyStoryNode1, readOnlyStoryNode2], '', '', '', '')));
    spyOn(topicViewerBackendApiService, 'fetchTopicDataAsync').and.returnValue(
      Promise.resolve(new ReadOnlyTopic(
        'topic_name', 'topic_Id', 'description',
        [], [], [], [], {}, {}, true, 'metatag', 'page_title_fragment')));

    // This throws "Type 'null' is not assignable to parameter of type
    // 'QuestionPlayerConfig'." We need to suppress this error because
    // of the need to test validations. This throws an error because
    // the value is null.
    // @ts-ignore
    componentInstance.questionPlayerConfig = null;

    componentInstance.ngOnInit();
    mockOnRatingUpdated.emit();
    tick(1000);

    expect(explorationPlayerStateService.isInStoryChapterMode)
      .toHaveBeenCalled();
    expect(componentInstance.inStoryMode).toBe(true);
    expect(componentInstance.storyId).toBe('story_id');
    expect(componentInstance.nextStoryNode).toBe(readOnlyStoryNode2);
    expect(componentInstance.getIconUrl).toHaveBeenCalledWith(
      'story_id', 'filename_2');
    expect(componentInstance.nextStoryNodeIconUrl).toBe('thumbnail_url');
    expect(urlInterpolationService.interpolateUrl).toHaveBeenCalled();
    expect(componentInstance.storyViewerUrl).toBe(
      'dummy_story_viewer_page_url');
    expect(componentInstance.practiceQuestionsAreEnabled).toBe(true);
    expect(componentInstance.userRating).toEqual(userRating);
    expect(alertsService.addSuccessMessage).toHaveBeenCalled();
    expect(learnerViewRatingService.getUserRating).toHaveBeenCalled();
    expect(componentInstance.collectionId).toEqual(collectionId);
  }));

  it('should not generate story page url and determine the next story node' +
  'if not in story mode', fakeAsync(() => {
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

  it('should obtain next chapter thumbnail url', () => {
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview')
      .and.returnValue('dummy_thumbnail_url');

    expect(componentInstance.getIconUrl('story_id', 'thumbnail_filename'))
      .toBe('dummy_thumbnail_url');
    expect(assetsBackendApiService.getThumbnailUrlForPreview)
      .toHaveBeenCalledWith('story', 'story_id', 'thumbnail_filename');
  });

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
    componentInstance.feedbackPopOver = mockNgbPopover;
    const userRating = 5;

    componentInstance.submitUserRating(userRating);

    expect(learnerViewRatingService.submitUserRating).toHaveBeenCalledWith(
      userRating);
  });

  it('should redirect to sign in page when user clicks on signin button',
    fakeAsync(() => {
      spyOn(siteAnalyticsService, 'registerNewSignupEvent');
      spyOn(userService, 'getLoginUrlAsync').and.returnValue(
        Promise.resolve('login_url'));

      componentInstance.signIn('.sign-in-button');
      tick();

      expect(userService.getLoginUrlAsync).toHaveBeenCalled();
      expect(siteAnalyticsService.registerNewSignupEvent).toHaveBeenCalled();
    }));

  it('should reload the page if user clicks on signin button and ' +
    'login url is not available', fakeAsync(() => {
    spyOn(siteAnalyticsService, 'registerNewSignupEvent');
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve(''));

    componentInstance.signIn('.sign-in-button');
    tick();

    expect(userService.getLoginUrlAsync).toHaveBeenCalled();
    expect(siteAnalyticsService.registerNewSignupEvent).toHaveBeenCalled();
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
      } as FeatureStatusChecker
    );

    expect(componentInstance.isEndChapterFeatureEnabled()).toBe(false);
  });
});
