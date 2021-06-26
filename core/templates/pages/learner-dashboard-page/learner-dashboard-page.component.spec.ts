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
import { LearnerExplorationSummary, LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';


import { CollectionSummary, CollectionSummaryBackendDict } from 'domain/collection/collection-summary.model';
import { ProfileSummary } from 'domain/user/profile-summary.model';
import { NonExistentActivities } from 'domain/learner_dashboard/non-existent-activities.model';
import { FeedbackThreadSummary } from
  'domain/feedback_thread/feedback-thread-summary.model';

import { LearnerDashboardPageComponent } from './learner-dashboard-page.component';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { MaterialModule } from 'components/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, NO_ERRORS_SCHEMA, Pipe } from '@angular/core';

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
  let userService: UserService = null;

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

  let learnerDashboardData = {
    completed_explorations_list: [],
    completed_collections_list: [],
    completed_stories_list: [],
    learnt_topic_list: [],
    incomplete_explorations_list: [],
    incomplete_collections_list: [],
    partially_learnt_topics_list: [],
    subscription_list: subscriptionsList,
    completed_to_incomplete_collections: [],
    completed_to_incomplete_stories: [],
    learnt_to_partially_learnt_topics: [],
    number_of_nonexistent_activities: {
      incomplete_explorations: 0,
      incomplete_collections: 0,
      completed_explorations: 0,
      completed_collections: 0,
      exploration_playlist: 0,
      collection_playlist: 0
    },
    thread_summaries: threadSummaryList,
    number_of_unread_threads: 10,
    exploration_playlist: [],
    collection_playlist: []
  };

  let userInfo = {
    _isModerator: true,
    _isAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  describe('when succesfully fetching learner dashboard data', () => {
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
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
          SuggestionModalForLearnerDashboardService,
          UrlInterpolationService,
          UserService,
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
      learnerDashboardBackendApiService =
        TestBed.inject(LearnerDashboardBackendApiService);
      suggestionModalForLearnerDashboardService =
        TestBed.inject(SuggestionModalForLearnerDashboardService);
      userService = TestBed.inject(UserService);

      spyOn(csrfTokenService, 'getTokenAsync').and.callFake(async() => {
        return Promise.resolve('sample-csrf-token');
      });
      // Generate completed explorations and exploration playlist.
      for (let i = 0; i < 10; i++) {
        learnerDashboardData.completed_explorations_list[i] = (
          explorationObjectFactory.createFromBackendDict(
            Object.assign(explorationDict, {
              id: i + 1,
              title: titleList[i],
              category: categoryList[i]
            })
          ));
        learnerDashboardData.exploration_playlist[i] = ({
          id: Number(i + 1).toString()
        });
      }

      // Generate incomplete explorations and incomplete exploration playlist.
      for (let i = 0; i < 12; i++) {
        learnerDashboardData.incomplete_explorations_list[i] = (
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
        learnerDashboardData.completed_collections_list[i] = (
          // TODO(#10875): Fix type mismatch.
          Collection.create(
            Object.assign(collectionDict, {
              title: titleList[i],
              category: categoryList[i]
            }) as unknown as CollectionBackendDict
          ));
        learnerDashboardData.collection_playlist[i] = ({
          id: Number(i + 1).toString()
        });
      }

      // Generate incomplete collections.
      for (let i = 0; i < 8; i++) {
        learnerDashboardData.incomplete_collections_list[i] = (
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

      spyOn(learnerDashboardBackendApiService, 'fetchLearnerDashboardDataAsync')
        .and.returnValue(Promise.resolve({
          completedExplorationsList: (
            learnerDashboardData.completed_explorations_list.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          incompleteExplorationsList: (
            learnerDashboardData.incomplete_explorations_list.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          explorationPlaylist: (
            learnerDashboardData.exploration_playlist.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          completedCollectionsList: (
            learnerDashboardData.completed_collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          incompleteCollectionsList: (
            learnerDashboardData.incomplete_collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          completedStoriesList: (
            learnerDashboardData.completed_stories_list.map(
              storySummary => StorySummary.createFromBackendDict(
                storySummary))),
          learntTopicsList: (
            learnerDashboardData.learnt_topic_list.map(
              topicSummary => LearnerTopicSummary.createFromBackendDict(
                topicSummary))),
          partiallyLearntTopicsList: (
            learnerDashboardData.partially_learnt_topics_list.map(
              topicSummary => LearnerTopicSummary.createFromBackendDict(
                topicSummary))),
          collectionPlaylist: (
            learnerDashboardData.collection_playlist.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          numberOfUnreadThreads: learnerDashboardData.number_of_unread_threads,
          threadSummaries: (
            learnerDashboardData.thread_summaries.map(
              threadSummary => FeedbackThreadSummary
                .createFromBackendDict(threadSummary))),
          completedToIncompleteCollections: (
            learnerDashboardData.completed_to_incomplete_collections),
          completedToIncompleteStories: (
            learnerDashboardData.completed_to_incomplete_stories),
          learntToPartiallyLearntTopics: (
            learnerDashboardData.learnt_to_partially_learnt_topics),
          numberOfNonexistentActivities: (
            NonExistentActivities.createFromBackendDict(
              learnerDashboardData.number_of_nonexistent_activities)),
          subscriptionList: (
            learnerDashboardData.subscription_list.map(
              profileSummary => ProfileSummary
                .createFromCreatorBackendDict(profileSummary)))
        }));

      component.ngOnInit();
      flush();
      fixture.detectChanges();
      flush();
    }));

    it('should initialize correctly component properties after its' +
    ' initialization and get data from backend', fakeAsync(() => {
      expect(component.profilePictureDataUrl).toBe(profilePictureDataUrl);
      expect(component.username).toBe(userInfo.getUsername());

      expect(component.noExplorationActivity).toBe(false);
      expect(component.noCollectionActivity).toBe(false);
      expect(component.noActivity).toBe(false);

      expect(component.incompleteExplorationsList.length).toBe(12);
      expect(component.incompleteCollectionsList.length).toBe(8);

      expect(component.explorationPlaylist.length).toBe(10);
      expect(component.explorationPlaylist.length).toBe(10);
    }));

    it('should set focus without scroll on browse lesson btn', fakeAsync(() => {
      const focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll');
      component.ngOnInit();
      flush();
      expect(focusSpy).toHaveBeenCalledWith('ourLessonsBtn');
    }));

    it('should get static image url', () => {
      let imagePath = '/path/to/image.png';
      expect(component.getStaticImageUrl(imagePath)).toBe(
        '/assets/images/path/to/image.png');
    });

    it('should toggle active subsection type when changing subsection type',
      () => {
        // Active subsection is set as I18N_DASHBOARD_EXPLORATIONS when
        // component is initialized.
        expect(component.activeSubsection).toBe('I18N_DASHBOARD_EXPLORATIONS');

        let newActiveSubsection = 'I18N_DASHBOARD_COLLECTIONS';
        component.setActiveSubsection(newActiveSubsection);
        expect(component.activeSubsection).toBe(newActiveSubsection);

        let newActiveSubsection2 = 'I18N_DASHBOARD_EXPLORATIONS';
        component.setActiveSubsection(newActiveSubsection2);
        expect(component.activeSubsection).toBe(newActiveSubsection2);
      });

    it('should get the correct exploration page URL corresponding to a given' +
      ' exploration ID.', () => {
      expect(component.getExplorationUrl('1')).toBe('/explore/1');
      expect(component.getExplorationUrl()).toBe('/explore/undefined');
    });

    it('should get the correct collection page URL corresponding to a given' +
      ' collection ID.', () => {
      expect(component.getCollectionUrl('1')).toBe('/collection/1');
      expect(component.getCollectionUrl()).toBe('/collection/undefined');
    });

    it('should detect when application is being used on a mobile', () => {
      expect(component.checkMobileView()).toBe(false);

      spyOnProperty(navigator, 'userAgent').and.returnValue('iPhone');
      expect(component.checkMobileView()).toBe(true);
    });

    it('should show username popover based on its length', () => {
      expect(component.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
      expect(component.showUsernamePopover('abc')).toBe('none');
    });

    it('should change page when going through pages of incomplete explorations',
      () => {
        let section = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
        let subsection = 'I18N_DASHBOARD_EXPLORATIONS';

        expect(component.startIncompleteExpIndex).toBe(0);

        component.goToNextPage(section, subsection);
        expect(component.startIncompleteExpIndex).toBe(8);

        component.goToPreviousPage(section, subsection);
        expect(component.startIncompleteExpIndex).toBe(0);
      });

    it('should change page when going through pages of incomplete collections',
      () => {
        let section = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
        let subsection = 'I18N_DASHBOARD_COLLECTIONS';

        expect(component.startIncompleteCollectionIndex).toBe(0);

        component.goToNextPage(section, subsection);
        expect(component.startIncompleteCollectionIndex).toBe(8);

        component.goToPreviousPage(section, subsection);
        expect(component.startIncompleteCollectionIndex).toBe(0);
      });

    it('should change page when going through pages of complete explorations',
      () => {
        let section = 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION';
        let subsection = 'I18N_DASHBOARD_EXPLORATIONS';

        let completedExplorations = learnerDashboardData
          .completed_explorations_list.map(
            expSummary => LearnerExplorationSummary.createFromBackendDict(
              expSummary));

        expect(component.startCompletedExpIndex).toBe(0);
        expect(component.getVisibleExplorationList(
          component.startCompletedExpIndex))
          .toEqual(completedExplorations.slice(0, 8));

        component.goToNextPage(section, subsection);
        expect(component.startCompletedExpIndex).toBe(8);
        expect(component.getVisibleExplorationList(
          component.startCompletedExpIndex))
          .toEqual(completedExplorations.slice(8));

        component.goToPreviousPage(section, subsection);
        expect(component.startCompletedExpIndex).toBe(0);
        expect(component.getVisibleExplorationList(
          component.startCompletedExpIndex))
          .toEqual(completedExplorations.slice(0, 8));
      });

    it('should change page when going through pages of completed collections',
      () => {
        let section = 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION';
        let subsection = 'I18N_DASHBOARD_COLLECTIONS';

        expect(component.startCompletedCollectionIndex).toBe(0);

        component.goToNextPage(section, subsection);
        expect(component.startCompletedCollectionIndex).toBe(8);

        component.goToPreviousPage(section, subsection);
        expect(component.startCompletedCollectionIndex).toBe(0);
      });

    it('should change explorations sorting options by title when changing' +
      ' sorting type', () => {
      component.setExplorationsSortingOptions('title');
      expect(component.currentExpSortType).toBe('title');
      expect(component.isCurrentExpSortDescending).toBe(true);
    });

    it('should change explorations sorting options by last played when' +
      ' changing sorting type', () => {
      expect(component.isCurrentExpSortDescending).toBe(true);
      expect(component.currentExpSortType).toBe('last_played');
      component.setExplorationsSortingOptions('last_played');
      expect(component.isCurrentExpSortDescending).toBe(false);
    });

    it('should change subscription sorting options by username when changing' +
      ' sorting type', () => {
      expect(component.isCurrentSubscriptionSortDescending).toBe(true);
      expect(component.currentSubscribersSortType).toBe('username');
      component.setSubscriptionSortingOptions('username');
      expect(component.isCurrentSubscriptionSortDescending).toBe(false);
    });

    it('should change subscription sorting options by impact when changing' +
      ' sorting type', () => {
      component.setSubscriptionSortingOptions('impact');
      expect(component.currentSubscribersSortType).toBe('impact');
      expect(component.isCurrentSubscriptionSortDescending).toBe(true);
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

    it('should sort explorations given sorting property' +
      ' as last played in ascending order', fakeAsync(() => {
      // The default sort option for Explorations is last played.
      expect(component.currentExpSortType).toBe('last_played');
      expect(component.isCurrentExpSortDescending).toBeTruthy;
      expect(component.getValueOfExplorationSortKey()).toBe('default');

      tick();
      fixture.detectChanges();

      const explorationTitleNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-exp-summary-tile-title');

      // The forEach loop is being used here because
      // getValueOfExplorationSortKey is used in a *ngFor directive.
      // Note that given Exploration list is not sorted.
      explorationTitleNodes.forEach((titleeNode, index) => {
        if (index === 0) {
          expect(titleeNode.innerText).toBe('World War III');
        }
        if (index === 1) {
          expect(titleeNode.innerText).toBe('Quantum Mechanics');
        }
        if (index === 2) {
          expect(titleeNode.innerText).toBe('Algebra');
        }
        if (index === 3) {
          expect(titleeNode.innerText).toBe('Nouns');
        }
        if (index === 4) {
          expect(titleeNode.innerText).toBe('Counting Stars');
        }
        if (index === 5) {
          expect(titleeNode.innerText).toBe('Hip Hop');
        }
        if (index === 6) {
          expect(titleeNode.innerText).toBe('Consiousness');
        }
        if (index === 7) {
          expect(titleeNode.innerText).toBe('Database Management');
        }
        if (index === 8) {
          expect(titleeNode.innerText).toBe('Plant Cell');
        }
        if (index === 9) {
          expect(titleeNode.innerText).toBe('Zebra');
        }
      });
    }));

    it('should sort explorations given sorting property' +
      ' as last played in descending order', fakeAsync(() => {
      // The default sort option for Explorations is last played.
      expect(component.currentExpSortType).toBe('last_played');
      expect(component.isCurrentExpSortDescending).toBeTruthy;
      expect(component.getValueOfExplorationSortKey()).toBe('default');

      component.setExplorationsSortingOptions('last_played');
      expect(component.getValueOfExplorationSortKey()).toBe('default');
      expect(component.isCurrentExpSortDescending).toBeFalse;

      tick();
      fixture.detectChanges();

      const explorationTitleNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-exp-summary-tile-title');

      // The forEach loop is being used here because
      // getValueOfExplorationSortKey is used in a *ngFor directive.
      // Note that given Exploration list is not sorted.
      explorationTitleNodes.forEach((titleeNode, index) => {
        if (index === 0) {
          expect(titleeNode.innerText).toBe('Zebra');
        }
        if (index === 1) {
          expect(titleeNode.innerText).toBe('Plant Cell');
        }
        if (index === 2) {
          expect(titleeNode.innerText).toBe('Database Management');
        }
        if (index === 3) {
          expect(titleeNode.innerText).toBe('Consiousness');
        }
        if (index === 4) {
          expect(titleeNode.innerText).toBe('Hip Hop');
        }
        if (index === 5) {
          expect(titleeNode.innerText).toBe('Counting Stars');
        }
        if (index === 6) {
          expect(titleeNode.innerText).toBe('Nouns');
        }
        if (index === 7) {
          expect(titleeNode.innerText).toBe('Algebra');
        }
        if (index === 8) {
          expect(titleeNode.innerText).toBe('Quantum Mechanics');
        }
        if (index === 9) {
          expect(titleeNode.innerText).toBe('World War III');
        }
      });
    }));

    it('should sort explorations given sorting property' +
      ' as category in ascending order', fakeAsync(() => {
      // The default sort option for Explorations is last played.
      expect(component.currentExpSortType).toBe('last_played');
      expect(component.isCurrentExpSortDescending).toBeTruthy;
      expect(component.getValueOfExplorationSortKey()).toBe('default');

      component.setExplorationsSortingOptions('category');
      expect(component.getValueOfExplorationSortKey()).toBe('category');

      tick();
      fixture.detectChanges();

      const explorationTitleNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-exp-summary-tile-title');

      // The forEach loop is being used here because
      // getValueOfExplorationSortKey is used in a *ngFor directive.
      // Note that given Exploration list is not sorted.
      explorationTitleNodes.forEach((titleeNode, index) => {
        if (index === 0) {
          expect(titleeNode.innerText).toBe('Hip Hop');
        }
        if (index === 1) {
          expect(titleeNode.innerText).toBe('Plant Cell');
        }
        if (index === 2) {
          expect(titleeNode.innerText).toBe('Database Management');
        }
        if (index === 3) {
          expect(titleeNode.innerText).toBe('Nouns');
        }
        if (index === 4) {
          expect(titleeNode.innerText).toBe('Counting Stars');
        }
        if (index === 5) {
          expect(titleeNode.innerText).toBe('Algebra');
        }
        if (index === 6) {
          expect(titleeNode.innerText).toBe('Consiousness');
        }
        if (index === 7) {
          expect(titleeNode.innerText).toBe('Quantum Nechanics');
        }
        if (index === 8) {
          expect(titleeNode.innerText).toBe('World War III');
        }
        if (index === 9) {
          expect(titleeNode.innerText).toBe('Zebra');
        }
      });
    }));

    it('should sort explorations given sorting property' +
      ' as category in descending order', fakeAsync(() => {
      // The default sort option for Explorations is last played.
      expect(component.currentExpSortType).toBe('last_played');
      expect(component.isCurrentExpSortDescending).toBeTruthy;
      expect(component.getValueOfExplorationSortKey()).toBe('default');

      component.setExplorationsSortingOptions('category');
      expect(component.getValueOfExplorationSortKey()).toBe('category');

      component.setExplorationsSortingOptions('category');
      expect(component.isCurrentExpSortDescending).toBeFalse;

      tick();
      fixture.detectChanges();

      const explorationTitleNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-exp-summary-tile-title');

      // The forEach loop is being used here because
      // getValueOfExplorationSortKey is used in a *ngFor directive.
      // Note that given Exploration list is not sorted.
      explorationTitleNodes.forEach((titleeNode, index) => {
        if (index === 0) {
          expect(titleeNode.innerText).toBe('Zebra');
        }
        if (index === 1) {
          expect(titleeNode.innerText).toBe('World War III');
        }
        if (index === 2) {
          expect(titleeNode.innerText).toBe('Quantum Nechanics');
        }
        if (index === 3) {
          expect(titleeNode.innerText).toBe('Consiousness');
        }
        if (index === 4) {
          expect(titleeNode.innerText).toBe('Algebra');
        }
        if (index === 5) {
          expect(titleeNode.innerText).toBe('Counting Stars');
        }
        if (index === 6) {
          expect(titleeNode.innerText).toBe('Nouns');
        }
        if (index === 7) {
          expect(titleeNode.innerText).toBe('Database Management');
        }
        if (index === 8) {
          expect(titleeNode.innerText).toBe('Plant Cell');
        }
        if (index === 9) {
          expect(titleeNode.innerText).toBe('Hip Hop');
        }
      });
    }));

    it('should sort explorations given sorting property' +
      ' as title in ascending order', fakeAsync(() => {
      // The default sort option for Explorations is last played.
      expect(component.currentExpSortType).toBe('last_played');
      expect(component.isCurrentExpSortDescending).toBeTruthy;
      expect(component.getValueOfExplorationSortKey()).toBe('default');

      component.setExplorationsSortingOptions('title');
      expect(component.getValueOfExplorationSortKey()).toBe('title');

      tick();
      fixture.detectChanges();

      const explorationTitleNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-exp-summary-tile-title');

      // The forEach loop is being used here because
      // getValueOfExplorationSortKey is used in a *ngFor directive.
      // Note that given Exploration list is not sorted.
      explorationTitleNodes.forEach((titleeNode, index) => {
        if (index === 0) {
          expect(titleeNode.innerText).toBe('Algebra');
        }
        if (index === 1) {
          expect(titleeNode.innerText).toBe('Consiousness');
        }
        if (index === 2) {
          expect(titleeNode.innerText).toBe('Counting Stars');
        }
        if (index === 3) {
          expect(titleeNode.innerText).toBe('Database Management');
        }
        if (index === 4) {
          expect(titleeNode.innerText).toBe('Hip Hop');
        }
        if (index === 5) {
          expect(titleeNode.innerText).toBe('Nouns');
        }
        if (index === 6) {
          expect(titleeNode.innerText).toBe('Plant Cell');
        }
        if (index === 7) {
          expect(titleeNode.innerText).toBe('Quantum Mechanics');
        }
        if (index === 8) {
          expect(titleeNode.innerText).toBe('World War III');
        }
        if (index === 9) {
          expect(titleeNode.innerText).toBe('Zebra');
        }
      });
    }));

    it('should sort explorations given sorting property' +
      ' as title in descending order', fakeAsync(() => {
      // The default sort option for Explorations is last played.
      expect(component.currentExpSortType).toBe('last_played');
      expect(component.isCurrentExpSortDescending).toBeTruthy;
      expect(component.getValueOfExplorationSortKey()).toBe('default');

      component.setExplorationsSortingOptions('title');
      expect(component.getValueOfExplorationSortKey()).toBe('title');

      component.setExplorationsSortingOptions('title');
      expect(component.isCurrentExpSortDescending).toBeFalse;

      tick();
      fixture.detectChanges();

      const explorationTitleNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-exp-summary-tile-title');

      // The forEach loop is being used here because
      // getValueOfExplorationSortKey is used in a *ngFor directive.
      // Note that given Exploration list is not sorted.
      explorationTitleNodes.forEach((titleeNode, index) => {
        if (index === 0) {
          expect(titleeNode.innerText).toBe('Zebra');
        }
        if (index === 1) {
          expect(titleeNode.innerText).toBe('World War III');
        }
        if (index === 2) {
          expect(titleeNode.innerText).toBe('Quantum Mechanics');
        }
        if (index === 3) {
          expect(titleeNode.innerText).toBe('Plant Cell');
        }
        if (index === 4) {
          expect(titleeNode.innerText).toBe('Nouns');
        }
        if (index === 5) {
          expect(titleeNode.innerText).toBe('Hip Hop');
        }
        if (index === 6) {
          expect(titleeNode.innerText).toBe('Database Management');
        }
        if (index === 7) {
          expect(titleeNode.innerText).toBe('Counting Stars');
        }
        if (index === 8) {
          expect(titleeNode.innerText).toBe('Consiousness');
        }
        if (index === 9) {
          expect(titleeNode.innerText).toBe('Algebra');
        }
      });
    }));

    it('should sort subscriptions given sorting property as username' +
      ' in ascending order', fakeAsync(() => {
      // The default sort option for Subscriptions is username.
      expect(component.currentSubscribersSortType).toBe('username');
      expect(component.getValueOfSubscriptionSortKey()).toBe('username');

      tick();
      fixture.detectChanges();

      const subscriptionsListImpactNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-subscription-name');

      const subscriptionsListUsernameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-impact-number');


      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListImpactNodes.forEach((impactNode, index) => {
        if (index === 0) {
          expect(impactNode.innerText).toBe(1);
        }
        if (index === 1) {
          expect(impactNode.innerText).toBe(0);
        }
        if (index === 2) {
          expect(impactNode.innerText).toBe(2);
        }
        if (index === 3) {
          expect(impactNode.innerText).toBe(3);
        }
      });

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListUsernameNodes.forEach((usernameNode, index) => {
        if (index === 0) {
          expect(usernameNode.innerText).toBe('Arrow');
        }
        if (index === 1) {
          expect(usernameNode.innerText).toBe('Bucky');
        }
        if (index === 2) {
          expect(usernameNode.innerText).toBe('Captain America');
        }
        if (index === 3) {
          expect(usernameNode.innerText).toBe('Deadpool');
        }
      });
    }));

    it('should sort subscriptions given sorting property as username' +
      ' in descending order', fakeAsync(() => {
      // The default sort option for Subscriptions is username.
      expect(component.currentSubscribersSortType).toBe('username');
      expect(component.isCurrentSubscriptionSortDescending).toBeTrue();

      expect(component.currentSubscribersSortType).toBe('username');
      expect(component.getValueOfSubscriptionSortKey()).toBe('username');

      component.setSubscriptionSortingOptions('username');
      expect(component.isCurrentSubscriptionSortDescending).toBeFalse();

      tick();
      fixture.detectChanges();

      const subscriptionsListImpactNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-subscription-name');

      const subscriptionsListUsernameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-impact-number');


      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListImpactNodes.forEach((impactNode, index) => {
        if (index === 0) {
          expect(impactNode.innerText).toBe(3);
        }
        if (index === 1) {
          expect(impactNode.innerText).toBe(2);
        }
        if (index === 2) {
          expect(impactNode.innerText).toBe(0);
        }
        if (index === 3) {
          expect(impactNode.innerText).toBe(1);
        }
      });

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListUsernameNodes.forEach((usernameNode, index) => {
        if (index === 0) {
          expect(usernameNode.innerText).toBe('Deadpool');
        }
        if (index === 1) {
          expect(usernameNode.innerText).toBe('Captain America');
        }
        if (index === 2) {
          expect(usernameNode.innerText).toBe('Bucky');
        }
        if (index === 3) {
          expect(usernameNode.innerText).toBe('Arrow');
        }
      });
    }));

    it('should sort subscriptions given sorting property as impact' +
      ' in ascending order', fakeAsync(() => {
      // The default sort option for Subscriptions is username.
      expect(component.currentSubscribersSortType).toBe('username');

      component.setSubscriptionSortingOptions('impact');
      expect(component.currentSubscribersSortType).toBe('impact');
      expect(component.getValueOfSubscriptionSortKey()).toBe('impact');

      tick();
      fixture.detectChanges();

      const subscriptionsListImpactNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-subscription-name');

      const subscriptionsListUsernameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-impact-number');


      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListImpactNodes.forEach((impactNode, index) => {
        if (index === 0) {
          expect(impactNode.innerText).toBe(0);
        }
        if (index === 1) {
          expect(impactNode.innerText).toBe(1);
        }
        if (index === 2) {
          expect(impactNode.innerText).toBe(2);
        }
        if (index === 3) {
          expect(impactNode.innerText).toBe(3);
        }
      });

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListUsernameNodes.forEach((usernameNode, index) => {
        if (index === 0) {
          expect(usernameNode.innerText).toBe('Bucky');
        }
        if (index === 1) {
          expect(usernameNode.innerText).toBe('Arrow');
        }
        if (index === 2) {
          expect(usernameNode.innerText).toBe('Captain America');
        }
        if (index === 3) {
          expect(usernameNode.innerText).toBe('Deadpool');
        }
      });
    }));

    it('should sort subscriptions given sorting property as impact' +
      ' in descending order', fakeAsync(() => {
      // The default sort option for Subscriptions is username.
      expect(component.currentSubscribersSortType).toBe('username');
      expect(component.isCurrentSubscriptionSortDescending).toBeTrue();

      component.setSubscriptionSortingOptions('impact');
      expect(component.currentSubscribersSortType).toBe('impact');
      expect(component.getValueOfSubscriptionSortKey()).toBe('impact');

      component.setSubscriptionSortingOptions('impact');
      expect(component.isCurrentSubscriptionSortDescending).toBeFalse();

      tick();
      fixture.detectChanges();

      const subscriptionsListImpactNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-subscription-name');

      const subscriptionsListUsernameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-impact-number');


      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListImpactNodes.forEach((impactNode, index) => {
        if (index === 0) {
          expect(impactNode.innerText).toBe(3);
        }
        if (index === 1) {
          expect(impactNode.innerText).toBe(2);
        }
        if (index === 2) {
          expect(impactNode.innerText).toBe(1);
        }
        if (index === 3) {
          expect(impactNode.innerText).toBe(0);
        }
      });

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListUsernameNodes.forEach((usernameNode, index) => {
        if (index === 0) {
          expect(usernameNode.innerText).toBe('Deadpool');
        }
        if (index === 1) {
          expect(usernameNode.innerText).toBe('Captain America');
        }
        if (index === 2) {
          expect(usernameNode.innerText).toBe('Arrow');
        }
        if (index === 3) {
          expect(usernameNode.innerText).toBe('Bucky');
        }
      });
    }));
    it('should sort subscriptions given sorting property as impact' +
      ' in descending order', fakeAsync(() => {
      // The default sort option for Subscriptions is username.
      expect(component.currentSubscribersSortType).toBe('username');
      expect(component.isCurrentSubscriptionSortDescending).toBeTrue();

      component.setSubscriptionSortingOptions('impact');
      expect(component.currentSubscribersSortType).toBe('impact');
      expect(component.getValueOfSubscriptionSortKey()).toBe('impact');

      component.setSubscriptionSortingOptions('impact');
      expect(component.isCurrentSubscriptionSortDescending).toBeFalse();

      tick();
      fixture.detectChanges();

      const subscriptionsListImpactNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-subscription-name');

      const subscriptionsListUsernameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-impact-number');


      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListImpactNodes.forEach((impactNode, index) => {
        if (index === 0) {
          expect(impactNode.innerText).toBe(3);
        }
        if (index === 1) {
          expect(impactNode.innerText).toBe(2);
        }
        if (index === 2) {
          expect(impactNode.innerText).toBe(1);
        }
        if (index === 3) {
          expect(impactNode.innerText).toBe(0);
        }
      });

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListUsernameNodes.forEach((usernameNode, index) => {
        if (index === 0) {
          expect(usernameNode.innerText).toBe('Deadpool');
        }
        if (index === 1) {
          expect(usernameNode.innerText).toBe('Captain America');
        }
        if (index === 2) {
          expect(usernameNode.innerText).toBe('Arrow');
        }
        if (index === 3) {
          expect(usernameNode.innerText).toBe('Bucky');
        }
      });
    }));
    it('should sort subscriptions given sorting property as impact' +
      ' in descending order', fakeAsync(() => {
      // The default sort option for Subscriptions is username.
      expect(component.currentSubscribersSortType).toBe('username');
      expect(component.isCurrentSubscriptionSortDescending).toBeTrue();

      component.setSubscriptionSortingOptions('impact');
      expect(component.currentSubscribersSortType).toBe('impact');
      expect(component.getValueOfSubscriptionSortKey()).toBe('impact');

      component.setSubscriptionSortingOptions('impact');
      expect(component.isCurrentSubscriptionSortDescending).toBeFalse();

      tick();
      fixture.detectChanges();

      const subscriptionsListImpactNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-subscription-name');

      const subscriptionsListUsernameNodes =
        fixture.debugElement.nativeElement
          .querySelectorAll('.protractor-test-impact-number');


      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListImpactNodes.forEach((impactNode, index) => {
        if (index === 0) {
          expect(impactNode.innerText).toBe(3);
        }
        if (index === 1) {
          expect(impactNode.innerText).toBe(2);
        }
        if (index === 2) {
          expect(impactNode.innerText).toBe(1);
        }
        if (index === 3) {
          expect(impactNode.innerText).toBe(0);
        }
      });

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a *ngFor directive.
      // Note that given subscription list is not sorted.
      subscriptionsListUsernameNodes.forEach((usernameNode, index) => {
        if (index === 0) {
          expect(usernameNode.innerText).toBe('Deadpool');
        }
        if (index === 1) {
          expect(usernameNode.innerText).toBe('Captain America');
        }
        if (index === 2) {
          expect(usernameNode.innerText).toBe('Arrow');
        }
        if (index === 3) {
          expect(usernameNode.innerText).toBe('Bucky');
        }
      });
    }));

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
          .querySelectorAll('.protractor-test-feedback-exploration');

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
          .querySelectorAll('.protractor-test-feedback-exploration');

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
          .querySelectorAll('.protractor-test-feedback-exploration');

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
          .querySelectorAll('.protractor-test-feedback-exploration');

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

    it('should open remove activity modal when removing activity', () => {
      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
      let activity = LearnerExplorationSummary.createFromBackendDict(
        learnerDashboardData.exploration_playlist[1]);
      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, activity);
    });

    it('should not remove an incomplete exploration if it is not present',
      fakeAsync(() => {
        expect(component.incompleteExplorationsList.length).toBe(12);

        let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
        let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
        // Get exploration with id 100.
        let activity = LearnerExplorationSummary.createFromBackendDict(
          // TODO(#10875): Fix type mismatch.
          {
            id: '100'
          } as unknown as LearnerExplorationSummaryBackendDict);
        component.openRemoveActivityModal(
          sectionNameI18nId, subsectionName, activity);

        tick();
        fixture.detectChanges();

        expect(component.incompleteExplorationsList.length).toBe(12);
      }));

    it('should not remove an exploration from exploration playlist' +
      ' if it is not present', fakeAsync(() => {
      expect(component.explorationPlaylist.length).toBe(10);

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
      // Get exploration with id 100.
      let activity = LearnerExplorationSummary.createFromBackendDict(
        // TODO(#10875): Fix type mismatch.
        {
          id: '100'
        } as unknown as LearnerExplorationSummaryBackendDict);
      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, activity);

      tick();
      fixture.detectChanges();

      expect(component.explorationPlaylist.length).toBe(10);
    }));

    it('should not remove a collection from collection playlist' +
      ' if it is not present', fakeAsync(() => {
      expect(component.collectionPlaylist.length).toBe(8);

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
      // Get collection with id 100.
      let activity = CollectionSummary.createFromBackendDict(
        // TODO(#10875): Fix type mismatch.
        {
          id: '100'
        } as unknown as CollectionSummaryBackendDict);
      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, activity);

      tick();
      fixture.detectChanges();

      expect(component.collectionPlaylist.length).toBe(8);
    }));

    it('should not remove a incomplete collection' +
      ' if it is not present', fakeAsync(() => {
      expect(component.incompleteCollectionsList.length).toBe(8);

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
      // Get collection with id 100.
      let activity = CollectionSummary.createFromBackendDict(
        // TODO(#10875): Fix type mismatch.
        {
          id: '100'
        } as unknown as CollectionSummaryBackendDict);
      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, activity);

      tick();
      fixture.detectChanges();

      expect(component.incompleteCollectionsList.length).toBe(8);
    }));

    it('should remove an activity from incomplete exploration when closing' +
      ' remove activity modal', fakeAsync(() => {
      expect(component.incompleteExplorationsList.length).toBe(12);

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
      // Get exploration with id 13.
      let activity = LearnerExplorationSummary.createFromBackendDict(
        learnerDashboardData.incomplete_explorations_list[2]);

      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, activity);

      tick();
      fixture.detectChanges();

      expect(component.incompleteExplorationsList.length).toBe(11);
    }));

    it('should remove an activity from incomplete collection when closing' +
      ' remove activity modal', fakeAsync(() => {
      expect(component.incompleteCollectionsList.length).toBe(8);

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';

      // Get collection with id 11.
      let activity = CollectionSummary.createFromBackendDict(
        learnerDashboardData.incomplete_collections_list[2]);

      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, activity);

      tick();
      fixture.detectChanges();

      expect(component.incompleteCollectionsList.length).toBe(7);
    }));

    it('should remove an exploration from exploration playlist when closing' +
      ' remove activity modal', fakeAsync(() => {
      expect(component.explorationPlaylist.length).toBe(10);

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';

      // Exploration with id 2.
      let activity = LearnerExplorationSummary.createFromBackendDict(
        learnerDashboardData.exploration_playlist[1]);

      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, activity);

      tick();
      fixture.detectChanges();

      expect(component.explorationPlaylist.length).toBe(9);
    }));

    it('should remove an activity from collection playlist when closing' +
      ' remove activity modal', fakeAsync(() => {
      expect(component.collectionPlaylist.length).toBe(8);

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
      // Get collection with id 2.
      let activity = CollectionSummary.createFromBackendDict(
        learnerDashboardData.collection_playlist[1]);
      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, activity);

      tick();

      expect(component.collectionPlaylist.length).toBe(7);
    }));

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
          UserService
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

      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        Promise.resolve('sample-csrf-token'));

      spyOn(userService, 'getProfileImageDataUrlAsync')
        .and.returnValue(Promise.resolve(profilePictureDataUrl));

      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(userInfo));
    }));

    it('should show an alert warning', fakeAsync(() => {
      const fetchDataSpy = spyOn(
        learnerDashboardBackendApiService, 'fetchLearnerDashboardDataAsync')
        .and.rejectWith(404);
      const alertsSpy = spyOn(alertsService, 'addWarning').and.returnValue();

      component.ngOnInit();

      tick();
      fixture.detectChanges();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Failed to get learner dashboard data');
      expect(fetchDataSpy).toHaveBeenCalled();
    }));
  });
});
