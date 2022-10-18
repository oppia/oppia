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
 * @fileoverview Unit tests for learner dashboard parge.
 */


import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';


import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { ProfileSummary } from 'domain/user/profile-summary.model';
import { FeedbackThreadSummary } from
  'domain/feedback_thread/feedback-thread-summary.model';

import { LearnerDashboardPageComponent } from './learner-dashboard-page.component';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { MaterialModule } from 'modules/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, EventEmitter, NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AlertsService } from 'services/alerts.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { ExplorationBackendDict, ExplorationObjectFactory } from 'domain/exploration/ExplorationObjectFactory';
import { LearnerDashboardBackendApiService } from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { LearnerDashboardActivityBackendApiService } from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { SuggestionModalForLearnerDashboardService } from './suggestion-modal/suggestion-modal-for-learner-dashboard.service';
import { SortByPipe } from 'filters/string-utility-filters/sort-by.pipe';
import { UserService } from 'services/user.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { StorySummary } from 'domain/story/story-summary.model';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NonExistentTopicsAndStories } from 'domain/learner_dashboard/non-existent-topics-and-stories.model';
import { NonExistentCollections } from 'domain/learner_dashboard/non-existent-collections.model';
import { NonExistentExplorations } from 'domain/learner_dashboard/non-existent-explorations.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { PageTitleService } from 'services/page-title.service';
import { LearnerGroupBackendApiService } from 'domain/learner_group/learner-group-backend-api.service';
import { UrlService } from 'services/contextual/url.service';

@Pipe({name: 'slice'})
class MockSlicePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockLearnerDashboardActivityBackendApiService {
  async removeActivityModalAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string): string {
    return key;
  }
}

@Component({selector: 'background-banner', template: ''})
class BackgroundBannerComponentStub {
}

@Component({selector: 'exploration-summary-tile', template: ''})
class ExplorationSummaryTileComponentStub {
}

@Component({selector: 'collection-summary-tile', template: ''})
class CollectionSummaryTileComponentStub {
}

@Component({selector: 'loading-dots', template: ''})
class LoadingDotsComponentStub {
}

describe('Learner dashboard page', () => {
  let component: LearnerDashboardPageComponent;
  let fixture: ComponentFixture<LearnerDashboardPageComponent>;
  let alertsService: AlertsService = null;
  let csrfTokenService: CsrfTokenService = null;
  let dateTimeFormatService: DateTimeFormatService = null;
  let explorationObjectFactory: ExplorationObjectFactory = null;
  let focusManagerService: FocusManagerService;
  let learnerDashboardBackendApiService:
    LearnerDashboardBackendApiService = null;
  let suggestionModalForLearnerDashboardService:
    SuggestionModalForLearnerDashboardService = null;
  let windowDimensionsService: WindowDimensionsService;
  let mockResizeEmitter: EventEmitter<void>;
  let userService: UserService = null;
  let translateService: TranslateService = null;
  let pageTitleService: PageTitleService = null;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;
  let urlService: UrlService;

  let profilePictureDataUrl = 'profile-picture-url';

  let explorationDict: ExplorationBackendDict = {
    init_state_name: 'Introduction',
    language_code: 'en',
    states: {},
    param_changes: [],
    param_specs: {},
    is_version_of_draft_valid: true,
    correctness_feedback_enabled: false,
    draft_changes: [],
    version: 1,
    draft_change_list_id: 3,
    title: 'Test Exploration',

  };

  let titleList = [
    'World War III', 'Quantum Mechanics', 'Algebra',
    'Nouns', 'Counting Stars', 'Hip Hop', 'Consiousness',
    'Database Management', 'Plant Cell', 'Zebra'
  ];

  let categoryList = [
    'Social', 'Science', 'Mathematics', 'English',
    'French', 'Arts', 'Pyschology',
    'Computer Science', 'Biology', 'Zoo'
  ];

  let threadSummaryList = [{
    status: 'open',
    original_author_id: '1',
    last_updated_msecs: 1000,
    last_message_text: 'Last Message',
    total_message_count: 5,
    last_message_is_read: false,
    second_last_message_is_read: true,
    author_last_message: '2',
    author_second_last_message: 'Last Message',
    exploration_title: 'Biology',
    exploration_id: 'exp1',
    thread_id: 'thread_1'
  },
  {
    status: 'open',
    original_author_id: '2',
    last_updated_msecs: 1001,
    last_message_text: 'Last Message',
    total_message_count: 5,
    last_message_is_read: false,
    second_last_message_is_read: true,
    author_last_message: '2',
    author_second_last_message: 'Last Message',
    exploration_title: 'Algebra',
    exploration_id: 'exp1',
    thread_id: 'thread_1'
  },
  {
    status: 'open',
    original_author_id: '3',
    last_updated_msecs: 1002,
    last_message_text: 'Last Message',
    total_message_count: 5,
    last_message_is_read: false,
    second_last_message_is_read: true,
    author_last_message: '2',
    author_second_last_message: 'Last Message',
    exploration_title: 'Three Balls',
    exploration_id: 'exp1',
    thread_id: 'thread_1'
  },
  {
    status: 'open',
    original_author_id: '4',
    last_updated_msecs: 1003,
    last_message_text: 'Last Message',
    total_message_count: 5,
    last_message_is_read: false,
    second_last_message_is_read: true,
    author_last_message: '2',
    author_second_last_message: 'Last Message',
    exploration_title: 'Zebra',
    exploration_id: 'exp1',
    thread_id: 'thread_1'
  }
  ];

  let subscriptionsList = [{
    creator_impact: 0,
    creator_picture_data_url: 'creatorA-url',
    creator_username: 'Bucky',
  },
  {
    creator_impact: 1,
    creator_picture_data_url: 'creatorB-url',
    creator_username: 'Arrow',
  },
  {
    creator_impact: 3,
    creator_picture_data_url: 'creatorD-url',
    creator_username: 'Deadpool',
  },
  {
    creator_impact: 2,
    creator_picture_data_url: 'creatorC-url',
    creator_username: 'Captain America',
  }];

  let collectionDict: CollectionBackendDict = {
    id: 'sample_collection_id',
    title: 'a title',
    objective: 'an objective',
    category: 'a category',
    version: 0,
    nodes: [],
    language_code: null,
    schema_version: null,
    tags: null,
    playthrough_dict: {
      next_exploration_id: 'expId',
      completed_exploration_ids: ['expId2']
    }
  };


  let learnerDashboardTopicAndStoriesData = {
    completed_stories_list: [],
    learnt_topic_list: [],
    partially_learnt_topics_list: [],
    topics_to_learn_list: [],
    all_topics_list: [],
    untracked_topics: {},
    completed_to_incomplete_stories: [],
    learnt_to_partially_learnt_topics: [],
    number_of_nonexistent_topics_and_stories: {
      partially_learnt_topics: 0,
      completed_stories: 0,
      learnt_topics: 0,
      topics_to_learn: 0,
    },
  };


  let learnerDashboardCollectionsData = {
    completed_collections_list: [],
    incomplete_collections_list: [],
    completed_to_incomplete_collections: [],
    number_of_nonexistent_collections: {
      incomplete_collections: 0,
      completed_collections: 0,
      collection_playlist: 0
    },
    collection_playlist: []
  };


  let learnerDashboardExplorationsData = {
    completed_explorations_list: [],
    incomplete_explorations_list: [],
    subscription_list: subscriptionsList,
    number_of_nonexistent_explorations: {
      incomplete_explorations: 0,
      completed_explorations: 0,
      exploration_playlist: 0,
    },
    exploration_playlist: [],
  };

  let learnerDashboardFeedbackUpdatesData = {
    thread_summaries: threadSummaryList,
    number_of_unread_threads: 10,
  };

  let userInfo = {
    _roles: ['USER_ROLE'],
    _isModerator: true,
    _isCurriculumAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isCurriculumAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    isTranslationAdmin: () => false,
    isBlogAdmin: () => false,
    isBlogPostEditor: () => false,
    isQuestionAdmin: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  describe('when succesfully fetching learner dashboard data', () => {
    beforeEach(async(() => {
      mockResizeEmitter = new EventEmitter();
      TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          MaterialModule,
          FormsModule,
          HttpClientTestingModule
        ],
        declarations: [
          LearnerDashboardPageComponent,
          MockTranslatePipe,
          SortByPipe,
          MockSlicePipe,
          MockTrunctePipe,
          BackgroundBannerComponentStub,
          ExplorationSummaryTileComponentStub,
          CollectionSummaryTileComponentStub,
          LoadingDotsComponentStub,
        ],
        providers: [
          AlertsService,
          DateTimeFormatService,
          ExplorationObjectFactory,
          FocusManagerService,
          LearnerDashboardBackendApiService,
          {
            provide: LearnerDashboardActivityBackendApiService,
            useClass: MockLearnerDashboardActivityBackendApiService
          },
          {
            provide: WindowDimensionsService,
            useValue: {
              isWindowNarrow: () => true,
              getResizeEvent: () => mockResizeEmitter,
            }
          },
          SuggestionModalForLearnerDashboardService,
          UrlInterpolationService,
          UserService,
          PageTitleService,
          {
            provide: TranslateService,
            useClass: MockTranslateService
          }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
    }));

    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(LearnerDashboardPageComponent);
      component = fixture.componentInstance;

      alertsService = TestBed.inject(AlertsService);
      csrfTokenService = TestBed.inject(CsrfTokenService);
      dateTimeFormatService = TestBed.inject(DateTimeFormatService);
      explorationObjectFactory = TestBed.inject(ExplorationObjectFactory);
      focusManagerService = TestBed.inject(FocusManagerService);
      windowDimensionsService = TestBed.inject(WindowDimensionsService);
      learnerDashboardBackendApiService =
        TestBed.inject(LearnerDashboardBackendApiService);
      suggestionModalForLearnerDashboardService =
        TestBed.inject(SuggestionModalForLearnerDashboardService);
      userService = TestBed.inject(UserService);
      translateService = TestBed.inject(TranslateService);
      pageTitleService = TestBed.inject(PageTitleService);
      urlService = TestBed.inject(UrlService);
      learnerGroupBackendApiService = TestBed.inject(
        LearnerGroupBackendApiService);

      spyOn(csrfTokenService, 'getTokenAsync').and.callFake(async() => {
        return Promise.resolve('sample-csrf-token');
      });
      // Generate completed explorations and exploration playlist.
      for (let i = 0; i < 10; i++) {
        learnerDashboardExplorationsData.completed_explorations_list[i] = (
          explorationObjectFactory.createFromBackendDict(
            Object.assign(explorationDict, {
              id: i + 1,
              title: titleList[i],
              category: categoryList[i]
            })
          ));
        learnerDashboardExplorationsData.exploration_playlist[i] = ({
          id: Number(i + 1).toString()
        });
      }

      // Generate incomplete explorations and incomplete exploration playlist.
      for (let i = 0; i < 12; i++) {
        learnerDashboardExplorationsData.incomplete_explorations_list[i] = (
          explorationObjectFactory.createFromBackendDict(
            Object.assign(explorationDict, {
              // Create ids from 11 to 22.
              // (1 to 10 is the complete explorations).
              id: Number(i + 11).toString(),
              title: titleList[i],
              category: categoryList[i]
            })
          ));
      }

      // Generate completed collections and collection playlist.
      for (let i = 0; i < 8; i++) {
        learnerDashboardCollectionsData.completed_collections_list[i] = (
          // TODO(#10875): Fix type mismatch.
          Collection.create(
            Object.assign(collectionDict, {
              title: titleList[i],
              category: categoryList[i]
            }) as unknown as CollectionBackendDict
          ));
        learnerDashboardCollectionsData.collection_playlist[i] = ({
          id: Number(i + 1).toString()
        });
      }

      // Generate incomplete collections.
      for (let i = 0; i < 8; i++) {
        learnerDashboardCollectionsData.incomplete_collections_list[i] = (
          // TODO(#10875): Fix type mismatch.
          Collection.create(
            Object.assign(collectionDict, {
              // Create ids from 9 to 16.
              // (1 to 8 is the complete collections).
              id: Number(i + 9).toString(),
              title: 'Collection Title ' + (i + 7),
            }) as unknown as CollectionBackendDict
          ));
      }

      spyOn(userService, 'getProfileImageDataUrlAsync').and
        .callFake(async() => {
          return Promise.resolve(profilePictureDataUrl);
        });

      spyOn(userService, 'getUserInfoAsync').and
        .callFake(async() => {
          return Promise.resolve(userInfo);
        });

      spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardTopicsAndStoriesDataAsync')
        .and.returnValue(Promise.resolve({
          completedStoriesList: (
            learnerDashboardTopicAndStoriesData.completed_stories_list.map(
              storySummary => StorySummary.createFromBackendDict(
                storySummary))),
          learntTopicsList: (
            learnerDashboardTopicAndStoriesData.learnt_topic_list.map(
              topicSummary => LearnerTopicSummary.createFromBackendDict(
                topicSummary))),
          partiallyLearntTopicsList: (
            learnerDashboardTopicAndStoriesData
              .partially_learnt_topics_list.map(
                topicSummary => LearnerTopicSummary.createFromBackendDict(
                  topicSummary))),
          topicsToLearnList: (
            learnerDashboardTopicAndStoriesData.topics_to_learn_list.map(
              topicSummary => LearnerTopicSummary
                .createFromBackendDict(topicSummary))),
          allTopicsList: (
            learnerDashboardTopicAndStoriesData.all_topics_list.map(
              topicSummary => LearnerTopicSummary
                .createFromBackendDict(topicSummary))),
          untrackedTopics: learnerDashboardTopicAndStoriesData.untracked_topics,
          completedToIncompleteStories: (
            learnerDashboardTopicAndStoriesData
              .completed_to_incomplete_stories),
          learntToPartiallyLearntTopics: (
            learnerDashboardTopicAndStoriesData
              .learnt_to_partially_learnt_topics),
          numberOfNonexistentTopicsAndStories: (
            NonExistentTopicsAndStories.createFromBackendDict(
              learnerDashboardTopicAndStoriesData.
                number_of_nonexistent_topics_and_stories)),
        }));

      spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardFeedbackUpdatesDataAsync')
        .and.returnValue(Promise.resolve({
          numberOfUnreadThreads: learnerDashboardFeedbackUpdatesData.
            number_of_unread_threads,
          threadSummaries: (
            learnerDashboardFeedbackUpdatesData.thread_summaries.map(
              threadSummary => FeedbackThreadSummary
                .createFromBackendDict(threadSummary))),
          paginatedThreadsList: []
        }));

      spyOn(learnerGroupBackendApiService, 'isLearnerGroupFeatureEnabledAsync')
        .and.returnValue(Promise.resolve(true));

      spyOn(urlService, 'getUrlParams').and.returnValue({
        active_tab: 'learner-groups',
      });

      component.ngOnInit();
      flush();
      fixture.detectChanges();
      flush();
    }));

    it('should initialize correctly component properties after its' +
    ' initialization and get data from backend', fakeAsync(() => {
      expect(component.profilePictureDataUrl).toBe(profilePictureDataUrl);
      expect(component.username).toBe(userInfo.getUsername());
      expect(component.windowIsNarrow).toBeTrue();
    }));

    it('should check whether window is narrow on resizing the screen', () => {
      spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

      expect(component.windowIsNarrow).toBeTrue();

      mockResizeEmitter.emit();

      expect(component.windowIsNarrow).toBeFalse();
    });

    it('should set focus without scroll on browse lesson btn', fakeAsync(() => {
      const focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll');

      component.ngOnInit();
      flush();

      expect(focusSpy).toHaveBeenCalledWith('ourLessonsBtn');
    }));

    it('should subscribe to onLangChange upon initialisation and set page ' +
    'title whenever language changes', fakeAsync(() => {
      spyOn(component.directiveSubscriptions, 'add');
      spyOn(translateService.onLangChange, 'subscribe');
      spyOn(component, 'setPageTitle');

      component.ngOnInit();
      flush();

      expect(component.directiveSubscriptions.add).toHaveBeenCalled();
      expect(translateService.onLangChange.subscribe).toHaveBeenCalled();

      translateService.onLangChange.emit();

      expect(component.setPageTitle).toHaveBeenCalled();
    }));

    it('should obtain translated page title and set it', () => {
      spyOn(translateService, 'instant').and.callThrough();
      spyOn(pageTitleService, 'setDocumentTitle');

      component.setPageTitle();

      expect(translateService.instant).toHaveBeenCalledWith(
        'I18N_LEARNER_DASHBOARD_PAGE_TITLE');
      expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
        'I18N_LEARNER_DASHBOARD_PAGE_TITLE');
    });

    it('should get static image url', () => {
      let imagePath = '/path/to/image.png';

      expect(component.getStaticImageUrl(imagePath)).toBe(
        '/assets/images/path/to/image.png');
    });

    it('should toggle active subsection type when changing subsection type',
      () => {
        // Active subsection is set as I18N_DASHBOARD_SKILL_PROFICIENCY when
        // component is initialized.
        expect(component.activeSubsection).toBe(
          'I18N_DASHBOARD_SKILL_PROFICIENCY');

        let newActiveSubsection2 = 'I18N_DASHBOARD_SKILL_PROFICIENCY';
        component.setActiveSubsection(newActiveSubsection2);

        expect(component.activeSubsection).toBe(newActiveSubsection2);
      });

    it('should show username popover based on its length', () => {
      expect(component.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
      expect(component.showUsernamePopover('abc')).toBe('none');
    });

    it('should change feedback sorting options by last update msecs when' +
      ' changing sorting type', () => {
      expect(component.isCurrentFeedbackSortDescending).toBe(true);
      expect(component.currentFeedbackThreadsSortType).toBe('lastUpdatedMsecs');

      component.setFeedbackSortingOptions('lastUpdatedMsecs');

      expect(component.isCurrentFeedbackSortDescending).toBe(false);
    });

    it('should change feedback sorting options by exploration when changing' +
      ' sorting type', () => {
      component.setFeedbackSortingOptions('exploration');

      expect(component.currentFeedbackThreadsSortType).toBe('exploration');
      expect(component.isCurrentFeedbackSortDescending).toBe(true);
    });

    it('should sort feedback updates given sorting property as last updated' +
      ' in ascending order', fakeAsync(() => {
      // The default sort option for Feedback Updates is last updated.
      expect(component.currentFeedbackThreadsSortType)
        .toBe('lastUpdatedMsecs');
      expect(component.isCurrentFeedbackSortDescending).toBeTrue();
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('lastUpdatedMsecs');

      tick();
      fixture.detectChanges();

      const feedbackListNameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.e2e-test-feedback-exploration');

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      feedbackListNameNodes.forEach((titleNode, index) => {
        if (index === 0) {
          expect(titleNode.innerText).toContain('Biology');
        }
        if (index === 1) {
          expect(titleNode.innerText).toContain('Algebra');
        }
        if (index === 2) {
          expect(titleNode.innerText).toContain('Three Balls');
        }
        if (index === 3) {
          expect(titleNode.innerText).toContain('Zebra');
        }
      });
    }));

    it('should sort feedback updates given sorting property as last updated' +
      ' in descending order', fakeAsync(() => {
      // The default sort option for Feedback Updates is last updated.
      expect(component.currentFeedbackThreadsSortType)
        .toBe('lastUpdatedMsecs');
      expect(component.isCurrentFeedbackSortDescending).toBeTrue();
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('lastUpdatedMsecs');

      component.setFeedbackSortingOptions('lastUpdatedMsecs');

      expect(component.isCurrentFeedbackSortDescending).toBeFalse();

      tick();
      fixture.detectChanges();

      const feedbackListNameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.e2e-test-feedback-exploration');

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      feedbackListNameNodes.forEach((titleNode, index) => {
        if (index === 0) {
          expect(titleNode.innerText).toContain('Zebra');
        }
        if (index === 1) {
          expect(titleNode.innerText).toContain('Three Balls');
        }
        if (index === 2) {
          expect(titleNode.innerText).toContain('Algebra');
        }
        if (index === 3) {
          expect(titleNode.innerText).toContain('Biology');
        }
      });
    }));

    it('should sort feedback updates given sorting property as exploration' +
      ' in ascending order', fakeAsync(() => {
      // The default sort option for Feedback Updates is last updated.
      expect(component.currentFeedbackThreadsSortType)
        .toBe('lastUpdatedMsecs');
      expect(component.isCurrentFeedbackSortDescending).toBeTrue();
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('lastUpdatedMsecs');

      component.setFeedbackSortingOptions('explorationTitle');

      expect(component.currentFeedbackThreadsSortType)
        .toBe('explorationTitle');
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('explorationTitle');

      tick();
      fixture.detectChanges();

      const feedbackListNameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.e2e-test-feedback-exploration');

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      feedbackListNameNodes.forEach((titleNode, index) => {
        if (index === 0) {
          expect(titleNode.innerText).toContain('Algebra');
        }
        if (index === 1) {
          expect(titleNode.innerText).toContain('Biology');
        }
        if (index === 2) {
          expect(titleNode.innerText).toContain('Three Balls');
        }
        if (index === 3) {
          expect(titleNode.innerText).toContain('Zebra');
        }
      });
    }));

    it('should sort feedback updates given sorting property as exploration' +
      ' in descending order', fakeAsync(() => {
      // The default sort option for Feedback Updates is last updated.
      expect(component.currentFeedbackThreadsSortType)
        .toBe('lastUpdatedMsecs');
      expect(component.isCurrentFeedbackSortDescending).toBeTrue();
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('lastUpdatedMsecs');

      component.setFeedbackSortingOptions('explorationTitle');

      expect(component.currentFeedbackThreadsSortType)
        .toBe('explorationTitle');
      expect(component.getValueOfFeedbackThreadSortKey())
        .toBe('explorationTitle');

      component.setFeedbackSortingOptions('explorationTitle');

      expect(component.isCurrentFeedbackSortDescending).toBeFalse();

      tick();
      fixture.detectChanges();

      const feedbackListNameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.e2e-test-feedback-exploration');

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      feedbackListNameNodes.forEach((titleNode, index) => {
        if (index === 0) {
          expect(titleNode.innerText).toContain('Zebra');
        }
        if (index === 1) {
          expect(titleNode.innerText).toContain('Three Balls');
        }
        if (index === 2) {
          expect(titleNode.innerText).toContain('Biology');
        }
        if (index === 3) {
          expect(titleNode.innerText).toContain('Algebra');
        }
      });
    }));

    it('should get messages in the thread from the backend when a thread is' +
      ' selected', fakeAsync(() => {
      let threadStatus = 'open';
      let explorationId = 'exp1';
      let threadId = 'thread_1';
      let explorationTitle = 'Exploration Title';
      let threadMessages = [{
        message_id: 1,
        text: 'Feedback 1',
        updated_status: 'open',
        suggestion_html: 'An instead of a',
        current_content_html: 'A orange',
        description: 'Suggestion for english grammar',
        author_username: 'username2',
        author_picture_data_url: 'foo',
        created_on_msecs: 1200
      }];
      const threadSpy = spyOn(
        learnerDashboardBackendApiService, 'onClickThreadAsync')
        .and.returnValue(Promise.resolve(threadMessages));

      expect(component.numberOfUnreadThreads).toBe(10);
      expect(component.loadingFeedbacks).toBe(false);

      component.onClickThread(
        threadStatus, explorationId, threadId, explorationTitle);

      expect(component.loadingFeedbacks).toBe(true);

      tick();
      fixture.detectChanges();

      expect(component.loadingFeedbacks).toBe(false);
      expect(component.feedbackThreadActive).toBe(true);
      expect(component.numberOfUnreadThreads).toBe(6);
      expect(component.messageSummaries.length).toBe(1);
      expect(threadSpy).toHaveBeenCalled();
    }));

    it('should set a new section as active when fetching message summary' +
      ' list from backend', fakeAsync(() => {
      let threadStatus = 'open';
      let explorationId = 'exp1';
      let threadId = 'thread_1';
      let explorationTitle = 'Exploration Title';
      let threadMessages = [{
        message_id: 1,
        text: 'Feedback 1',
        updated_status: 'open',
        suggestion_html: 'An instead of a',
        current_content_html: 'A orange',
        description: 'Suggestion for english grammar',
        author_username: 'username2',
        author_picture_data_url: 'foo',
        created_on_msecs: 1200
      }];
      const threadSpy = spyOn(
        learnerDashboardBackendApiService, 'onClickThreadAsync')
        .and.returnValue(Promise.resolve(threadMessages));

      expect(component.numberOfUnreadThreads).toBe(10);
      expect(component.loadingFeedbacks).toBe(false);

      component.onClickThread(
        threadStatus, explorationId, threadId, explorationTitle);

      expect(component.loadingFeedbacks).toBe(true);

      tick();
      fixture.detectChanges();

      expect(component.loadingFeedbacks).toBe(false);
      expect(component.feedbackThreadActive).toBe(true);
      expect(component.numberOfUnreadThreads).toBe(6);
      expect(component.messageSummaries.length).toBe(1);
      expect(threadSpy).toHaveBeenCalled();

      let newActiveSectionName = 'I18N_LEARNER_DASHBOARD_FEEDBACK_SECTION';
      component.setActiveSection(newActiveSectionName);

      expect(component.activeSection).toBe(newActiveSectionName);
      expect(component.feedbackThreadActive).toBe(false);

      let newActiveSectionName2 = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      component.setActiveSection(newActiveSectionName2);

      expect(component.activeSection).toBe(newActiveSectionName2);
      expect(component.feedbackThreadActive).toBe(false);
    }));

    it('should show all threads when a thread is not selected',
      fakeAsync(() => {
        let threadStatus = 'open';
        let explorationId = 'exp1';
        let threadId = 'thread_1';
        let explorationTitle = 'Exploration Title';
        let threadMessages = [{
          message_id: 1,
          text: 'Feedback 1',
          updated_status: 'open',
          suggestion_html: 'An instead of a',
          current_content_html: 'A orange',
          description: 'Suggestion for english grammar',
          author_username: 'username2',
          author_picture_data_url: 'foo',
          created_on_msecs: 1200
        }];

        const threadSpy =
          spyOn(learnerDashboardBackendApiService, 'onClickThreadAsync')
            .and.returnValue(Promise.resolve(threadMessages));

        expect(component.numberOfUnreadThreads).toBe(10);
        expect(component.loadingFeedbacks).toBe(false);

        component.onClickThread(
          threadStatus, explorationId, threadId, explorationTitle);

        expect(component.loadingFeedbacks).toBe(true);

        tick();
        fixture.detectChanges();

        expect(component.loadingFeedbacks).toBe(false);
        expect(component.feedbackThreadActive).toBe(true);
        expect(component.numberOfUnreadThreads).toBe(6);
        expect(component.messageSummaries.length).toBe(1);
        expect(threadSpy).toHaveBeenCalled();

        component.showAllThreads();

        expect(component.feedbackThreadActive).toBe(false);
        expect(component.numberOfUnreadThreads).toBe(6);
      }));

    it('should add a new message in a thread when there is a thread selected',
      fakeAsync(() => {
        let threadStatus = 'open';
        let explorationId = 'exp1';
        let threadId = 'thread_1';
        let explorationTitle = 'Exploration Title';
        let message = 'This is a new message';
        let threadMessages = [{
          message_id: 1,
          text: 'Feedback 1',
          updated_status: 'open',
          suggestion_html: 'An instead of a',
          current_content_html: 'A orange',
          description: 'Suggestion for english grammar',
          author_username: 'username2',
          author_picture_data_url: 'foo',
          created_on_msecs: 1200
        }];

        const threadSpy = spyOn(
          learnerDashboardBackendApiService, 'onClickThreadAsync')
          .and.returnValue(Promise.resolve(threadMessages));

        const addMessageSpy = spyOn(
          learnerDashboardBackendApiService, 'addNewMessageAsync')
          .and.returnValue(Promise.resolve());

        expect(component.numberOfUnreadThreads).toBe(10);
        expect(component.loadingFeedbacks).toBe(false);

        component.onClickThread(
          threadStatus, explorationId, threadId, explorationTitle);

        expect(component.loadingFeedbacks).toBe(true);

        tick();
        fixture.detectChanges();

        expect(component.loadingFeedbacks).toBe(false);
        expect(component.feedbackThreadActive).toBe(true);
        expect(component.numberOfUnreadThreads).toBe(6);
        expect(component.messageSummaries.length).toBe(1);
        expect(threadSpy).toHaveBeenCalled();

        component.addNewMessage(threadId, message);

        expect(component.messageSendingInProgress).toBe(true);

        tick();
        fixture.detectChanges();

        expect(component.messageSendingInProgress).toBe(false);
        expect(addMessageSpy).toHaveBeenCalled();
      }));

    it('should show new and old content when opening suggestion modal',
      () => {
        spyOn(suggestionModalForLearnerDashboardService, 'showSuggestionModal')
          .and.returnValue(null);

        let newContent = 'New content';
        let oldContent = 'Old content';
        let description = 'Description';
        component.showSuggestionModal(newContent, oldContent, description);

        expect(suggestionModalForLearnerDashboardService.showSuggestionModal)
          .toHaveBeenCalledWith('edit_exploration_state_content', {
            newContent: newContent,
            oldContent: oldContent,
            description: description
          });
      });

    it('should get css classes based on status', () => {
      expect(component.getLabelClass('open')).toBe('badge badge-info');
      expect(component.getLabelClass('compliment')).toBe('badge badge-success');
      expect(component.getLabelClass('another')).toBe('badge badge-secondary');
    });

    it('should get human readable status from provided status', () => {
      expect(component.getHumanReadableStatus('open')).toBe('Open');
      expect(component.getHumanReadableStatus('compliment')).toBe('Compliment');
      expect(component.getHumanReadableStatus('not_actionable')).toBe(
        'Not Actionable');
    });

    it('should get formatted date string from the timestamp in milliseconds',
      () => {
        // This corresponds to Fri, 2 Apr 2021 09:45:00 GMT.
        let NOW_MILLIS = 1617393321345;
        spyOn(dateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
          .withArgs(NOW_MILLIS).and.returnValue('4/2/2021');

        expect(component.getLocaleAbbreviatedDatetimeString(NOW_MILLIS))
          .toBe('4/2/2021');
      });

    it('should sanitize given png base64 data and generate url', () => {
      let result = component.decodePngURIData('%D1%88%D0%B5%D0%BB%D0%BB%D1%8B');

      fixture.detectChanges();

      expect(result).toBe('шеллы');
    });
  });

  describe('when fetching dashboard data fails', () => {
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          MaterialModule,
          FormsModule,
          HttpClientTestingModule
        ],
        declarations: [
          LearnerDashboardPageComponent,
          MockTranslatePipe,
          SortByPipe,
          MockSlicePipe,
          MockTrunctePipe,
          BackgroundBannerComponentStub,
          ExplorationSummaryTileComponentStub,
          CollectionSummaryTileComponentStub,
          LoadingDotsComponentStub,
        ],
        providers: [
          AlertsService,
          CsrfTokenService,
          LearnerDashboardBackendApiService,
          UserService,
          PageTitleService,
          {
            provide: TranslateService,
            useClass: MockTranslateService
          }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
    }));

    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(LearnerDashboardPageComponent);
      component = fixture.componentInstance;
      alertsService = TestBed.inject(AlertsService);
      csrfTokenService = TestBed.inject(CsrfTokenService);
      learnerDashboardBackendApiService =
        TestBed.inject(LearnerDashboardBackendApiService);
      userService = TestBed.inject(UserService);
      translateService = TestBed.inject(TranslateService);
      pageTitleService = TestBed.inject(PageTitleService);

      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        Promise.resolve('sample-csrf-token'));

      spyOn(userService, 'getProfileImageDataUrlAsync')
        .and.returnValue(Promise.resolve(profilePictureDataUrl));

      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(userInfo));
    }));

    it('should show an alert warning when fails to get topics and' +
     ' stories data', fakeAsync(() => {
      const fetchDataSpy = spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardTopicsAndStoriesDataAsync')
        .and.rejectWith(404);
      const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

      component.ngOnInit();

      tick();
      fixture.detectChanges();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Failed to get learner dashboard topics and stories data');
      expect(fetchDataSpy).toHaveBeenCalled();
    }));

    it('should show an alert warning when fails to get collections data' +
      'in mobile view',
    fakeAsync(() => {
      const fetchDataSpy = spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardCollectionsDataAsync')
        .and.rejectWith(404);
      const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

      let newActiveSectionName = 'I18N_DASHBOARD_LESSONS';
      component.setActiveSubsection(newActiveSectionName);

      tick();
      fixture.detectChanges();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Failed to get learner dashboard collections data');
      expect(fetchDataSpy).toHaveBeenCalled();
    }));

    it('should show an alert warning when fails to get explorations data in' +
    'mobile view',
    fakeAsync(() => {
      const fetchDataSpy = spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardExplorationsDataAsync')
        .and.rejectWith(404);
      const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

      let newActiveSectionName = 'I18N_DASHBOARD_LESSONS';
      component.setActiveSubsection(newActiveSectionName);

      tick();
      fixture.detectChanges();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Failed to get learner dashboard explorations data');
      expect(fetchDataSpy).toHaveBeenCalled();
    }));

    it('should get explorations and collections data when user clicks ' +
    'communtiy lessons tab in mobile view',
    fakeAsync(() => {
      const fetchCollectionsDataSpy = spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardCollectionsDataAsync')
        .and.returnValue(Promise.resolve({
          completedCollectionsList: (
            learnerDashboardCollectionsData.completed_collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          incompleteCollectionsList: (
            learnerDashboardCollectionsData.incomplete_collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          collectionPlaylist: (
            learnerDashboardCollectionsData.collection_playlist.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          completedToIncompleteCollections: (
            learnerDashboardCollectionsData
              .completed_to_incomplete_collections),
          numberOfNonexistentCollections: (
            NonExistentCollections.createFromBackendDict(
              learnerDashboardCollectionsData
                .number_of_nonexistent_collections)),
        }));

      const fetchExplorationsDataSpy = spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardExplorationsDataAsync')
        .and.returnValue(Promise.resolve({
          completedExplorationsList: (
            learnerDashboardExplorationsData.completed_explorations_list.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          incompleteExplorationsList: (
            learnerDashboardExplorationsData.incomplete_explorations_list.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          explorationPlaylist: (
            learnerDashboardExplorationsData.exploration_playlist.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          numberOfNonexistentExplorations: (
            NonExistentExplorations.createFromBackendDict(
              learnerDashboardExplorationsData
                .number_of_nonexistent_explorations)),
          subscriptionList: (
            learnerDashboardExplorationsData.subscription_list.map(
              profileSummary => ProfileSummary
                .createFromCreatorBackendDict(profileSummary)))
        }));

      let newActiveSectionName = 'I18N_DASHBOARD_LESSONS';
      component.setActiveSubsection(newActiveSectionName);

      tick();
      fixture.detectChanges();

      expect(fetchCollectionsDataSpy).toHaveBeenCalled();
      flush();
      expect(fetchExplorationsDataSpy).toHaveBeenCalled();
      expect(component.communtiyLessonsDataLoaded).toEqual(true);
    }));

    it('should show an alert warning when fails to get collections data ' +
      'in web view',
    fakeAsync(() => {
      const fetchDataSpy = spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardCollectionsDataAsync')
        .and.rejectWith(404);
      const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

      let newActiveSectionName = (
        'I18N_LEARNER_DASHBOARD_COMMUNITY_LESSONS_SECTION');
      component.setActiveSection(newActiveSectionName);

      tick();
      fixture.detectChanges();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Failed to get learner dashboard collections data');
      expect(fetchDataSpy).toHaveBeenCalled();
    }));

    it('should show an alert warning when fails to get explorations data in ' +
    'web view',
    fakeAsync(() => {
      const fetchDataSpy = spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardExplorationsDataAsync')
        .and.rejectWith(404);
      const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

      let newActiveSectionName = (
        'I18N_LEARNER_DASHBOARD_COMMUNITY_LESSONS_SECTION');
      component.setActiveSection(newActiveSectionName);

      tick();
      fixture.detectChanges();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Failed to get learner dashboard explorations data');
      expect(fetchDataSpy).toHaveBeenCalled();
    }));

    it('should get explorations and collections data when user clicks ' +
    'communtiy lessons tab in web view',
    fakeAsync(() => {
      const fetchCollectionsDataSpy = spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardCollectionsDataAsync')
        .and.returnValue(Promise.resolve({
          completedCollectionsList: (
            learnerDashboardCollectionsData.completed_collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          incompleteCollectionsList: (
            learnerDashboardCollectionsData.incomplete_collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          collectionPlaylist: (
            learnerDashboardCollectionsData.collection_playlist.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          completedToIncompleteCollections: (
            learnerDashboardCollectionsData
              .completed_to_incomplete_collections),
          numberOfNonexistentCollections: (
            NonExistentCollections.createFromBackendDict(
              learnerDashboardCollectionsData
                .number_of_nonexistent_collections)),
        }));

      const fetchExplorationsDataSpy = spyOn(
        learnerDashboardBackendApiService,
        'fetchLearnerDashboardExplorationsDataAsync')
        .and.returnValue(Promise.resolve({
          completedExplorationsList: (
            learnerDashboardExplorationsData.completed_explorations_list.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          incompleteExplorationsList: (
            learnerDashboardExplorationsData.incomplete_explorations_list.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          explorationPlaylist: (
            learnerDashboardExplorationsData.exploration_playlist.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          numberOfNonexistentExplorations: (
            NonExistentExplorations.createFromBackendDict(
              learnerDashboardExplorationsData
                .number_of_nonexistent_explorations)),
          subscriptionList: (
            learnerDashboardExplorationsData.subscription_list.map(
              profileSummary => ProfileSummary
                .createFromCreatorBackendDict(profileSummary)))
        }));

      let newActiveSectionName = (
        'I18N_LEARNER_DASHBOARD_COMMUNITY_LESSONS_SECTION');
      component.setActiveSection(newActiveSectionName);

      tick();
      fixture.detectChanges();

      expect(fetchCollectionsDataSpy).toHaveBeenCalled();
      flush();
      expect(fetchExplorationsDataSpy).toHaveBeenCalled();
      expect(component.communtiyLessonsDataLoaded).toEqual(true);
    }));

    it('should show an alert warning when fails to get feedback updates data',
      fakeAsync(() => {
        const fetchDataSpy = spyOn(
          learnerDashboardBackendApiService,
          'fetchLearnerDashboardFeedbackUpdatesDataAsync')
          .and.rejectWith(404);
        const alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

        component.ngOnInit();

        tick();
        fixture.detectChanges();

        expect(alertsSpy).toHaveBeenCalledWith(
          'Failed to get learner dashboard feedback updates data');
        expect(fetchDataSpy).toHaveBeenCalled();
      }));

    it('should unsubscribe upon component destruction', () => {
      spyOn(component.directiveSubscriptions, 'unsubscribe');

      component.ngOnDestroy();

      expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
    });
  });
});
