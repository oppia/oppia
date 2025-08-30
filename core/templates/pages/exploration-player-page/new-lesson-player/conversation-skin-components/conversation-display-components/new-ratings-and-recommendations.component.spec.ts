// Copyright 2025 The Oppia Authors. All Rights Reserved.
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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  EventEmitter,
  NO_ERRORS_SCHEMA,
  Pipe,
  PipeTransform,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {UserService} from 'services/user.service';
import {LearnerViewRatingService} from '../../../services/learner-view-rating.service';
import {NewRatingsAndRecommendationsComponent} from './new-ratings-and-recommendations.component';
import {ExplorationModeService} from '../../../services/exploration-mode.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {LocalStorageService} from 'services/local-storage.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {StoryViewerBackendApiService} from 'domain/story_viewer/story-viewer-backend-api.service';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {StoryPlaythrough} from 'domain/story_viewer/story-playthrough.model';
import {ReadOnlyStoryNode} from 'domain/story_viewer/read-only-story-node.model';
import {ReadOnlyTopic} from 'domain/topic_viewer/read-only-topic.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {ConversationFlowService} from '../../../services/conversation-flow.service';
import {PageContextService} from 'services/page-context.service';
import {LessonFeedbackModalComponent} from '../../sidebar-components/lesson-feedback-modal.component';
import {CustomizableThankYouModalComponent} from '../../sidebar-components/customizable-thank-you-modal.component';
import {MockTranslatePipe} from '../../../../../tests/unit-test-utils';
import {of} from 'rxjs';

@Pipe({name: 'limitTo'})
export class MockLimitToPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('New Ratings and recommendations component', () => {
  let fixture: ComponentFixture<NewRatingsAndRecommendationsComponent>;
  let componentInstance: NewRatingsAndRecommendationsComponent;
  let alertsService: AlertsService;
  let learnerViewRatingService: LearnerViewRatingService;
  let urlService: UrlService;
  let userService: UserService;
  let explorationModeService: ExplorationModeService;
  let urlInterpolationService: UrlInterpolationService;
  let conversationFlowService: ConversationFlowService;
  let localStorageService: LocalStorageService;
  let assetsBackendApiService: AssetsBackendApiService;
  let storyViewerBackendApiService: StoryViewerBackendApiService;
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let siteAnalyticsService: SiteAnalyticsService;
  let windowDimensionsService: WindowDimensionsService;
  let ngbModal: NgbModal;
  let bottomSheet: MatBottomSheet;
  let windowRef: WindowRef;

  class MockWindowRef {
    nativeWindow = {
      location: {
        search: '',
        pathname: '/path/name',
        reload: jasmine.createSpy('reload'),
      },
    };
  }

  class MockPageContextService {
    private pageContext = 'EXPLORATION_PLAYER';
    getExplorationId(): string {
      return 'test_id';
    }
    getExplorationVersion(): number {
      return 1;
    }
    isInExplorationEditorPage(): boolean {
      return false;
    }
    isInQuestionPlayerMode(): boolean {
      return false;
    }
    getPageContext(): string {
      return this.pageContext;
    }
    setExplorationVersion(version: number): void {}
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        NewRatingsAndRecommendationsComponent,
        MockLimitToPipe,
        MockTranslatePipe,
      ],
      providers: [
        AlertsService,
        LearnerViewRatingService,
        UrlService,
        UserService,
        ExplorationModeService,
        UrlInterpolationService,
        ConversationFlowService,
        WindowDimensionsService,
        {provide: PageContextService, useClass: MockPageContextService},
        AssetsBackendApiService,
        StoryViewerBackendApiService,
        TopicViewerBackendApiService,
        LocalStorageService,
        SiteAnalyticsService,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: NgbModal,
          useValue: jasmine.createSpyObj('NgbModal', ['open']),
        },
        {
          provide: MatBottomSheet,
          useValue: jasmine.createSpyObj('MatBottomSheet', ['open']),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewRatingsAndRecommendationsComponent);
    componentInstance = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    learnerViewRatingService = TestBed.inject(LearnerViewRatingService);
    urlService = TestBed.inject(UrlService);
    userService = TestBed.inject(UserService);
    conversationFlowService = TestBed.inject(ConversationFlowService);
    explorationModeService = TestBed.inject(ExplorationModeService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    localStorageService = TestBed.inject(LocalStorageService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    storyViewerBackendApiService = TestBed.inject(StoryViewerBackendApiService);
    topicViewerBackendApiService = TestBed.inject(TopicViewerBackendApiService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    ngbModal = TestBed.inject(NgbModal);
    bottomSheet = TestBed.inject(MatBottomSheet);
    windowRef = TestBed.inject(WindowRef);
  });

  it('should create', () => {
    expect(componentInstance).toBeTruthy();
  });

  it(
    'should populate internal properties and subscribe to event' +
      ' listeners on initialize',
    fakeAsync(() => {
      const collectionId = 'collection_id';
      const userRating = 5;
      const mockOnRatingUpdated = new EventEmitter<void>();
      const readOnlyStoryNode1 = new ReadOnlyStoryNode(
        'node_1',
        '',
        '',
        [],
        [],
        [],
        '',
        false,
        '',
        {} as LearnerExplorationSummary,
        false,
        'bg_color_1',
        'filename_1'
      );
      const readOnlyStoryNode2 = new ReadOnlyStoryNode(
        'node_2',
        '',
        '',
        [],
        [],
        [],
        '',
        false,
        '',
        {} as LearnerExplorationSummary,
        false,
        'bg_color_2',
        'filename_2'
      );

      expect(componentInstance.inStoryMode).toBe(undefined);
      expect(componentInstance.storyViewerUrl).toBe(undefined);
      expect(componentInstance.practiceQuestionsAreEnabled).toBe(false);

      spyOn(urlService, 'getCollectionIdFromExplorationUrl').and.returnValue(
        collectionId
      );
      spyOn(learnerViewRatingService, 'getUserRating').and.returnValue(
        userRating
      );
      spyOn(alertsService, 'addSuccessMessage');
      spyOn(learnerViewRatingService, 'init').and.callFake(
        (callb: (rating: number) => void) => {
          callb(userRating);
        }
      );
      spyOn(explorationModeService, 'isInStoryChapterMode').and.returnValue(
        true
      );
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
        'dummy_story_viewer_page_url'
      );
      spyOnProperty(
        learnerViewRatingService,
        'onRatingUpdated'
      ).and.returnValue(mockOnRatingUpdated);
      spyOn(componentInstance, 'getIconUrl').and.returnValue('thumbnail_url');
      spyOn(urlService, 'getUrlParams').and.returnValue({
        story_url_fragment: 'story_url_fragment',
        topic_url_fragment: 'topic_url_fragment',
        classroom_url_fragment: 'classroom_url_fragment',
        node_id: 'node_1',
      });
      spyOn(
        storyViewerBackendApiService,
        'fetchStoryDataAsync'
      ).and.returnValue(
        Promise.resolve(
          new StoryPlaythrough(
            'story_id',
            [readOnlyStoryNode1, readOnlyStoryNode2],
            '',
            '',
            '',
            ''
          )
        )
      );
      spyOn(
        topicViewerBackendApiService,
        'fetchTopicDataAsync'
      ).and.returnValue(
        Promise.resolve(
          new ReadOnlyTopic(
            'topic_name',
            'topic_Id',
            'description',
            [],
            [],
            [],
            [],
            {},
            {},
            true,
            'metatag',
            'page_title_fragment'
          )
        )
      );

      componentInstance.questionPlayerConfig = null;

      componentInstance.ngOnInit();
      mockOnRatingUpdated.emit();
      tick(1000);

      expect(explorationModeService.isInStoryChapterMode).toHaveBeenCalled();
      expect(componentInstance.inStoryMode).toBe(true);
      expect(componentInstance.storyId).toBe('story_id');
      expect(componentInstance.nextStoryNode).toBe(readOnlyStoryNode2);
      expect(componentInstance.getIconUrl).toHaveBeenCalledWith(
        'story_id',
        'filename_2'
      );
      expect(componentInstance.nextStoryNodeIconUrl).toBe('thumbnail_url');
      expect(urlInterpolationService.interpolateUrl).toHaveBeenCalled();
      expect(componentInstance.storyViewerUrl).toBe(
        'dummy_story_viewer_page_url'
      );
      expect(componentInstance.practiceQuestionsAreEnabled).toBe(true);
      expect(componentInstance.userRating).toEqual(userRating);
      expect(alertsService.addSuccessMessage).toHaveBeenCalled();
      expect(learnerViewRatingService.getUserRating).toHaveBeenCalled();
      expect(componentInstance.collectionId).toEqual(collectionId);
    })
  );

  it('should not find next story node when current node is the last', fakeAsync(() => {
    const readOnlyStoryNode1 = new ReadOnlyStoryNode(
      'node_1',
      '',
      '',
      [],
      [],
      [],
      '',
      false,
      '',
      {} as LearnerExplorationSummary,
      false,
      'bg_color_1',
      'filename_1'
    );

    spyOn(explorationModeService, 'isInStoryChapterMode').and.returnValue(true);
    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_url_fragment: 'story_url_fragment',
      topic_url_fragment: 'topic_url_fragment',
      classroom_url_fragment: 'classroom_url_fragment',
      node_id: 'node_1',
    });
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(
        new StoryPlaythrough('story_id', [readOnlyStoryNode1], '', '', '', '')
      )
    );
    spyOn(topicViewerBackendApiService, 'fetchTopicDataAsync').and.returnValue(
      Promise.resolve(
        new ReadOnlyTopic(
          'topic_name',
          'topic_Id',
          'description',
          [],
          [],
          [],
          [],
          {},
          {},
          true,
          'metatag',
          'page_title_fragment'
        )
      )
    );

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.nextStoryNode).toBe(null);
  }));

  it(
    'should not generate story page url and determine the next story node' +
      'if not in story mode',
    fakeAsync(() => {
      expect(componentInstance.inStoryMode).toBe(undefined);
      expect(componentInstance.storyViewerUrl).toBe(undefined);

      spyOn(explorationModeService, 'isInStoryChapterMode').and.returnValue(
        false
      );
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
        'dummy_story_viewer_page_url'
      );

      componentInstance.ngOnInit();
      tick();

      expect(explorationModeService.isInStoryChapterMode).toHaveBeenCalled();
      expect(componentInstance.inStoryMode).toBe(false);
      expect(urlInterpolationService.interpolateUrl).not.toHaveBeenCalled();
      expect(componentInstance.storyViewerUrl).toBe(undefined);
    })
  );

  it('should obtain next chapter thumbnail url', () => {
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and.returnValue(
      'dummy_thumbnail_url'
    );

    expect(componentInstance.getIconUrl('story_id', 'thumbnail_filename')).toBe(
      'dummy_thumbnail_url'
    );
    expect(
      assetsBackendApiService.getThumbnailUrlForPreview
    ).toHaveBeenCalledWith('story', 'story_id', 'thumbnail_filename');
  });

  it('should return true for mobile screen size when width is less than breakpoint', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(400);

    expect(componentInstance.isMobileScreenSize()).toBe(true);
  });

  it('should return false for mobile screen size when width is greater than breakpoint', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(600);

    expect(componentInstance.isMobileScreenSize()).toBe(false);
  });

  it('should show feedback modal for mobile screen', () => {
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'afterDismissed',
    ]);
    mockBottomSheetRef.afterDismissed.and.returnValue(of('submit'));

    spyOn(componentInstance, 'isMobileScreenSize').and.returnValue(true);
    spyOn(componentInstance, 'showThankYouModal').and.returnValue(
      mockBottomSheetRef
    );
    (bottomSheet.open as jasmine.Spy).and.returnValue(mockBottomSheetRef);

    const result = componentInstance.showFeedbackModal();

    expect(bottomSheet.open).toHaveBeenCalledWith(
      LessonFeedbackModalComponent,
      {
        disableClose: true,
      }
    );
    expect(result).toBe(mockBottomSheetRef);
  });

  it('should show feedback modal for desktop screen', () => {
    const mockModalRef = jasmine.createSpyObj('NgbModalRef', ['result']);
    mockModalRef.result = Promise.resolve();

    spyOn(componentInstance, 'isMobileScreenSize').and.returnValue(false);
    spyOn(componentInstance, 'showThankYouModal').and.returnValue(mockModalRef);
    (ngbModal.open as jasmine.Spy).and.returnValue(mockModalRef);

    const result = componentInstance.showFeedbackModal();

    expect(ngbModal.open).toHaveBeenCalledWith(LessonFeedbackModalComponent, {
      backdrop: 'static',
    });
    expect(result).toBe(mockModalRef);
  });

  it('should show thank you modal for mobile screen', () => {
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'afterDismissed',
    ]);
    const i18nKey = 'I18N_PLAYER_THANK_FEEDBACK';

    spyOn(componentInstance, 'isMobileScreenSize').and.returnValue(true);
    (bottomSheet.open as jasmine.Spy).and.returnValue(mockBottomSheetRef);

    const result = componentInstance.showThankYouModal(i18nKey);

    expect(bottomSheet.open).toHaveBeenCalledWith(
      CustomizableThankYouModalComponent,
      {
        data: {
          modalMessageI18nKey: i18nKey,
        },
      }
    );
    expect(result).toBe(mockBottomSheetRef);
  });

  it('should show thank you modal for desktop screen', () => {
    const mockModalRef = jasmine.createSpyObj('NgbModalRef', [
      'componentInstance',
    ]);
    const i18nKey = 'I18N_PLAYER_THANK_FEEDBACK';
    mockModalRef.componentInstance = {};

    spyOn(componentInstance, 'isMobileScreenSize').and.returnValue(false);
    (ngbModal.open as jasmine.Spy).and.returnValue(mockModalRef);

    const result = componentInstance.showThankYouModal(i18nKey);

    expect(ngbModal.open).toHaveBeenCalledWith(
      CustomizableThankYouModalComponent,
      {
        backdrop: true,
      }
    );
    expect(mockModalRef.componentInstance.modalMessageI18nKey).toBe(i18nKey);
    expect(result).toBe(mockModalRef);
  });

  it('should submit user rating when user clicks on rating star', () => {
    spyOn(learnerViewRatingService, 'submitUserRating');
    const userRating = 5;

    componentInstance.submitUserRating(userRating);

    expect(learnerViewRatingService.submitUserRating).toHaveBeenCalledWith(
      userRating
    );
  });

  it('should redirect to sign in page when user clicks on signin button', fakeAsync(() => {
    spyOn(siteAnalyticsService, 'registerNewSignupEvent');
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve('login_url')
    );

    componentInstance.signIn('.sign-in-button');
    tick();

    expect(userService.getLoginUrlAsync).toHaveBeenCalled();
    expect(siteAnalyticsService.registerNewSignupEvent).toHaveBeenCalledWith(
      '.sign-in-button'
    );
    expect(windowRef.nativeWindow.location).toBe('login_url');
  }));

  it(
    'should reload the page if user clicks on signin button and ' +
      'login url is not available',
    fakeAsync(() => {
      spyOn(siteAnalyticsService, 'registerNewSignupEvent');
      spyOn(userService, 'getLoginUrlAsync').and.returnValue(
        Promise.resolve('')
      );

      componentInstance.signIn('.sign-in-button');
      tick();

      expect(userService.getLoginUrlAsync).toHaveBeenCalled();
      expect(siteAnalyticsService.registerNewSignupEvent).toHaveBeenCalledWith(
        '.sign-in-button'
      );
      expect(windowRef.nativeWindow.location.reload).toHaveBeenCalled();
    })
  );

  it('should return the value from getIsRefresherExploration', () => {
    const expectedValue = true;
    spyOn(conversationFlowService, 'getIsRefresherExploration').and.returnValue(
      expectedValue
    );

    const result = componentInstance.getIsRefresherExploration();

    expect(
      conversationFlowService.getIsRefresherExploration
    ).toHaveBeenCalled();
    expect(result).toBe(expectedValue);
  });

  it('should return the value from getParentExplorationIds', () => {
    const expectedIds = ['exp1', 'exp2'];
    spyOn(conversationFlowService, 'getParentExplorationIds').and.returnValue(
      expectedIds
    );

    const result = componentInstance.getParentExplorationIds();

    expect(conversationFlowService.getParentExplorationIds).toHaveBeenCalled();
    expect(result).toBe(expectedIds);
  });

  it("should save user's sign up section preference to localStorage", () => {
    spyOn(localStorageService, 'updateEndChapterSignUpSectionHiddenPreference');

    componentInstance.hideSignUpSection();

    expect(
      localStorageService.updateEndChapterSignUpSectionHiddenPreference
    ).toHaveBeenCalledWith('true');
  });

  it("should get user's sign up section preference from localStorage", () => {
    const getPreferenceSpy = spyOn(
      localStorageService,
      'getEndChapterSignUpSectionHiddenPreference'
    ).and.returnValue('true');

    expect(componentInstance.isSignUpSectionHidden()).toBe(true);
    expect(
      localStorageService.getEndChapterSignUpSectionHiddenPreference
    ).toHaveBeenCalled();

    getPreferenceSpy.and.returnValue(null);

    expect(componentInstance.isSignUpSectionHidden()).toBe(false);
  });

  it('should initialize when questionPlayerConfig is provided', fakeAsync(() => {
    componentInstance.questionPlayerConfig = {
      resultActionButtons: [],
      skillList: ['skill1'],
      skillDescriptions: ['desc1'],
      questionCount: 5,
      questionsSortedByDifficulty: true,
    };

    spyOn(explorationModeService, 'isInStoryChapterMode').and.returnValue(
      false
    );
    spyOn(urlService, 'getCollectionIdFromExplorationUrl').and.returnValue(
      'collection_id'
    );
    spyOn(learnerViewRatingService, 'init');

    componentInstance.ngOnInit();
    tick();

    expect(learnerViewRatingService.init).not.toHaveBeenCalled();
  }));

  it('should unsubscribe from all subscriptions on destroy', () => {
    spyOn(componentInstance.directiveSubscriptions, 'unsubscribe');

    componentInstance.ngOnDestroy();

    expect(
      componentInstance.directiveSubscriptions.unsubscribe
    ).toHaveBeenCalled();
  });
});
