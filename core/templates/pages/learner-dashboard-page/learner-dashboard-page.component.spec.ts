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
 * @fileoverview Unit tests for learner dashboard parge.
 */


import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { LearnerExplorationSummary, LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';


import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { ProfileSummary } from 'domain/user/profile-summary.model';
import { NonExistentActivities } from 'domain/learner_dashboard/non-existent-activities.model';
import { FeedbackThreadSummary } from
  'domain/feedback_thread/feedback-thread-summary.model';

import { LearnerDashboardPageComponent } from './learner-dashboard-page.component';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { CsrfTokenService } from 'services/csrf-token.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { ExplorationBackendDict, ExplorationObjectFactory } from 'domain/exploration/ExplorationObjectFactory';
import { LearnerDashboardBackendApiService } from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { SuggestionModalForLearnerDashboardService } from './suggestion-modal/suggestion-modal-for-learner-dashboard.service';
import { UserService } from 'services/user.service';
import { AlertsService } from 'services/alerts.service';
import { UserInfo } from 'os';
import { MaterialModule } from 'components/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { PngSanitizerService } from 'services/png-sanitizer.service';
import { PromoBar } from 'domain/promo_bar/promo-bar.model';
import { JsonpClientBackend } from '@angular/common/http';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

@Pipe({name: 'sortBy'})
class MockSortByPipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

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

fdescribe('Learner dashboard page', () => {

  let component: LearnerDashboardPageComponent;
  let fixture: ComponentFixture<LearnerDashboardPageComponent>;
  
  // let component = null;
  // let $httpBackend = null;
  // let Promise = null;
  // let $rootScope = null;
  // let $scope = null;
  // let $timeout = null;
  // let $window = null;

  let alertsService: AlertsService = null;
  let csrfTokenService: CsrfTokenService = null;
  let dateTimeFormatService: DateTimeFormatService = null;
  let explorationObjectFactory: ExplorationObjectFactory = null;
  let learnerDashboardBackendApiService:
    LearnerDashboardBackendApiService = null;
  let suggestionModalForLearnerDashboardService:
    SuggestionModalForLearnerDashboardService = null;
  let userService: UserService = null;
  let focusManagerService: FocusManagerService = null;
  let $flushPendingTasks = null;
  let profilePictureDataUrl = 'profile-picture-url';
  let pngSanitizerService: PngSanitizerService

  let pngServiceSpy: jasmine.Spy;

  let explorationDict: ExplorationBackendDict = {
    init_state_name: 'Introduction',
    language_code: 'en',
    states: {},
    // states: {
    //   Introduction: {
    //     param_changes: [],
    //     content: {
    //       html: '',
    //       audio_translations: {}
    //     },
    //     recorded_voiceovers: {
    //       voiceovers_mapping: {}
    //     },
    //     written_translations: {
    //       translations_mapping: {}
    //     },
    //     unresolved_answers: {},
    //     interaction: {
    //       customization_args: {},
    //       answer_groups: [],
    //       default_outcome: {
    //         param_changes: [],
    //         dest: 'Introduction',
    //         feedback: {
    //           html: '',
    //           audio_translations: {}
    //         }
    //       },
    //       hints: [],
    //       confirmed_unclassified_answers: [],
    //       id: null
    //     }
    //   }
    // },
    param_changes: [],
    param_specs: {},
    is_version_of_draft_valid: true,
    draft_changes: [],
    version: '1',
    draft_change_list_id: 3,
    title: 'Test Exploration',

  };

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
    incomplete_explorations_list: [],
    incomplete_collections_list: [],
    subscription_list: [{
      creator_impact: null,
      creator_picture_data_url: 'creator1-url',
      creator_username: 'username1',
    }, {
      creator_impact: null,
      creator_picture_data_url: 'creator1-url',
      creator_username: 'username1',
    }],
    number_of_nonexistent_activities: {
      incomplete_explorations: 0,
      incomplete_collections: 0,
      completed_explorations: 0,
      completed_collections: 0,
      exploration_playlist: 0,
      collection_playlist: 0
    },
    completed_to_incomplete_collections: [],
    thread_summaries: [{
      status: 'open',
      original_author_id: '1',
      last_updated_msecs: 1000,
      last_message_text: 'Last Message',
      total_message_count: 5,
      last_message_is_read: false,
      second_last_message_is_read: true,
      author_last_message: '2',
      author_second_last_message: 'Last Message',
      exploration_title: 'Exploration Title',
      exploration_id: 'exp1',
      thread_id: 'thread_1'
    }],
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
    isModerator: () =>  true,
    isAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  // let userInfo = {
  //   isModerator: () =>  true,
  //   isAdmin: () => false,
  //   isSuperAdmin: () => false,
  //   isTopicManager: () => false,
  //   canCreateCollections: () => true,
  //   getPreferredSiteLanguageCode: () =>'en',
  //   getUsername: () => 'username1',
  //   getEmail: () => 'tester@example.org',
  //   isLoggedIn: () => true
  // };
  // let learnerDashboardData = null;
  // importAllAngularServices();
  // beforeEach(angular.mock.module('oppia', function($provide) {
  //   let ugs = new UpgradedServices();
  //   for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
  //     $provide.value(key, value);
  //   }
  // }));

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
          MockSortByPipe,
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
          SuggestionModalForLearnerDashboardService,
          PngSanitizerService,
          UserService,
          WindowRef,
          // {
          //   provide: PromoBarBackendApiService,
          //   useClass: MockPromoBarBackendApiService
          // }
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
      learnerDashboardBackendApiService =
        TestBed.inject(LearnerDashboardBackendApiService);
      suggestionModalForLearnerDashboardService =
        TestBed.inject(SuggestionModalForLearnerDashboardService);
      userService = TestBed.inject(UserService);

      spyOn(csrfTokenService, 'getTokenAsync').and.callFake(() => {
        return Promise.resolve('sample-csrf-token');
      });

      // Generate completed explorations and exploration playlist.
      for (let i = 0; i < 10; i++) {
        learnerDashboardData.completed_explorations_list[i] = (
          explorationObjectFactory.createFromBackendDict(
            Object.assign(explorationDict, {
              exploration_id: i + 1,
              title: 'Exploration Title ' + (i + 1),
              category: 'Astronomy'
            })
          ));
        learnerDashboardData.exploration_playlist[i] = ({
          id: Number(i + 1).toString()
        });
      }

      // Generate incomplete explorations.
      for (let i = 0; i < 12; i++) {
        learnerDashboardData.incomplete_explorations_list[i] = (
          explorationObjectFactory.createFromBackendDict(
            Object.assign(explorationDict, {
              // Create ids from 10 to 22.
              // (1 to 10 is the complete explorations).
              exploration_id: i + 11,
              title: 'Exploration Title ' + (i + 11),
              category: 'Astronomy'
            })
          ));
      }

      // Generate completed collections and collection playlist.
      for (let i = 0; i < 8; i++) {
        learnerDashboardData.completed_collections_list[i] = (
          // TODO(#10875): Fix type mismatch.
          Collection.create(
            Object.assign(collectionDict, {
              id: i + 1,
              title: 'Collection Title ' + (i + 1),
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
              // Create ids from 9 to 17.
              // (0 to 8 is the complete collections).
              id: i + 10,
              title: 'Collection Title ' + (i + 7),
            }) as unknown as CollectionBackendDict
          ));
      }

      spyOn(userService, 'getProfileImageDataUrlAsync').and
        .callFake(() => {
          let dataUrl = spyOn(pngSanitizerService, 'getTrustedPngResourceUrl')
            .and.returnValue('profile-picture-url');
          return Promise.resolve(JSON.stringify(dataUrl));
        });

      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(userInfo));

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
          numberOfNonexistentActivities: (
            NonExistentActivities.createFromBackendDict(
              learnerDashboardData.number_of_nonexistent_activities)),
          subscriptionList: (
            learnerDashboardData.subscription_list.map(
              profileSummary => ProfileSummary
                .createFromCreatorBackendDict(profileSummary)))
        }));

      component.ngOnInit();
      tick();
      fixture.detectChanges();
    }));

    // beforeEach(angular.mock.inject(function($injector, $componentController) {
    //   $httpBackend = $injector.get('$httpBackend');
    //   Promise = $injector.get('Promise');
    //   $window = $injector.get('$window');
    //   $timeout = $injector.get('$timeout');
    //   let $rootScope = $injector.get('$rootScope');
    //   $uibModal = $injector.get('$uibModal');
    //   $flushPendingTasks = $injector.get('$flushPendingTasks');
    //   focusManagerService = $injector.get('FocusManagerService');
    //   csrfTokenService = TestBed.inject(CsrfTokenService);
    //   DateTimeFormatService = $injector.get('DateTimeFormatService');
    //   ExplorationObjectFactory = $injector.get('ExplorationObjectFactory');
    //   LearnerDashboardBackendApiService = $injector.get(
    //     'LearnerDashboardBackendApiService');
    //   SuggestionModalForLearnerDashboardService = $injector.get(
    //     'SuggestionModalForLearnerDashboardService');
    //   UserService = $injector.get('UserService');

      

    //   $scope = $rootScope.$new();
    //   component = $componentController('learnerDashboardPage', {
    //     $rootScope: $scope
    //   });
    //   component.$onInit();
    //   $scope.$apply();
    // }));

    it('should initialize correctly component properties after its' +
    ' initialization and get data from backend', fakeAsync(() => {
      // const pngServiceSpy = spyOn(
      //   pngSanitizerService, 'getTrustedPngResourceUrl')
      //   .and.returnValue('profile-picture-url');
      expect(component.profilePictureDataUrl).toBe(profilePictureDataUrl);
      expect(component.username).toBe(userInfo.getUsername());

      expect(component.noExplorationActivity).toBe(false);
      expect(component.noCollectionActivity).toBe(false);
      expect(component.noActivity).toBe(false);

      expect(pngServiceSpy).toHaveBeenCalled();
    }));

    // it('should set focus on browse lesson btn', () => {
    //   let spy = spyOn(component, 'addFocusWithoutScroll');
    //   $flushPendingTasks();
    //   expect(spy).toHaveBeenCalledWith('ourLessonsBtn');
    // });

    // it('should scroll back to top of window after focusing', () => {
    //   let focusSpy = spyOn(focusManagerService, 'setFocus');
    //   let windowSpy = spyOn($window, 'scrollTo');
    //   component.addFocusWithoutScroll('ourLessonsBtn');
    //   $timeout.flush();
    //   expect(focusSpy).toHaveBeenCalledWith('ourLessonsBtn');
    //   expect(windowSpy).toHaveBeenCalled();
    // });
    it('should get static image url', () => {
      let imagePath = '/path/to/image.png';
      expect(component.getStaticImageUrl(imagePath)).toBe(
        '/assets/images/path/to/image.png');
    });

  //   it('should set a new section as active when fetching message summary' +
  //     ' list from backend', () => {
  //     let threadStatus = 'open';
  //     let explorationId = 'exp1';
  //     let threadId = 'thread_1';
  //     let explorationTitle = 'Exploration Title';
  //     let threadMessages = [{
  //       message_id: '1',
  //       text: 'Feedback 1',
  //       updated_status: 'open',
  //       suggestion_html: 'An instead of a',
  //       current_content_html: 'A orange',
  //       description: 'Suggestion for english grammar',
  //       author_username: 'username2',
  //       author_picture_data_url: 'foo',
  //       created_on_msecs: 1200
  //     }];

  //     expect(component.numberOfUnreadThreads).toBe(10);

  //     $httpBackend.expect('GET', '/learnerdashboardthreadhandler/thread_1')
  //       .respond({
  //         message_summary_list: threadMessages
  //       });
  //     component.onClickThread(
  //       threadStatus, explorationId, threadId, explorationTitle);
  //     $httpBackend.flush();
  //     expect(component.feedbackThreadActive).toBe(true);

  //     let newActiveSectionName = 'I18N_LEARNER_DASHBOARD_FEEDBACK_SECTION';
  //     component.setActiveSection(newActiveSectionName);

  //     expect(component.activeSection).toBe(newActiveSectionName);
  //     expect(component.feedbackThreadActive).toBe(false);

  //     let newActiveSectionName2 = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
  //     component.setActiveSection(newActiveSectionName2);

  //     expect(component.activeSection).toBe(newActiveSectionName2);
  //     expect(component.feedbackThreadActive).toBe(false);
  //   });

  //   it('should toggle active subsection type when changing subsection type',
  //     () => {
  //       // Active subsection is set as I18N_DASHBOARD_EXPLORATIONS when
  //       // component is initialized.
  //       expect(component.activeSubsection).toBe('I18N_DASHBOARD_EXPLORATIONS');

  //       let newActiveSubsection = 'I18N_DASHBOARD_COLLECTIONS';
  //       component.setActiveSubsection(newActiveSubsection);
  //       expect(component.activeSubsection).toBe(newActiveSubsection);

  //       let newActiveSubsection2 = 'I18N_DASHBOARD_EXPLORATIONS';
  //       component.setActiveSubsection(newActiveSubsection2);
  //       expect(component.activeSubsection).toBe(newActiveSubsection2);
  //     });

  //   it('should get the correct exploration page URL corresponding to a given' +
  //     ' exploration ID.', () => {
  //     expect(component.getExplorationUrl('1')).toBe('/explore/1');
  //     expect(component.getExplorationUrl()).toBe('/explore/undefined');
  //   });

  //   it('should get the correct collection page URL corresponding to a given' +
  //     ' collection ID.', () => {
  //     expect(component.getCollectionUrl('1')).toBe('/collection/1');
  //     expect(component.getCollectionUrl()).toBe('/collection/undefined');
  //   });

  //   it('should detect when application is being used on a mobile', () => {
  //     expect(component.checkMobileView()).toBe(false);

  //     spyOnProperty(navigator, 'userAgent').and.returnValue('iPhone');
  //     expect(component.checkMobileView()).toBe(true);
  //   });

  //   it('should show username popover based on its length', () => {
  //     expect(component.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
  //     expect(component.showUsernamePopover('abc')).toBe('none');
  //   });

  //   it('should change page when going through pages of incomplete explorations',
  //     () => {
  //       let section = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
  //       let subsection = 'I18N_DASHBOARD_EXPLORATIONS';

  //       expect(component.startIncompleteExpIndex).toBe(0);

  //       component.goToNextPage(section, subsection);
  //       expect(component.startIncompleteExpIndex).toBe(8);

  //       component.goToPreviousPage(section, subsection);
  //       expect(component.startIncompleteExpIndex).toBe(0);
  //     });

  //   it('should change page when going through pages of incomplete collections',
  //     () => {
  //       let section = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
  //       let subsection = 'I18N_DASHBOARD_COLLECTIONS';

  //       expect(component.startIncompleteCollectionIndex).toBe(0);

  //       component.goToNextPage(section, subsection);
  //       expect(component.startIncompleteCollectionIndex).toBe(8);

  //       component.goToPreviousPage(section, subsection);
  //       expect(component.startIncompleteCollectionIndex).toBe(0);
  //     });

  //   it('should change page when going through pages of complete explorations',
  //     () => {
  //       let section = 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION';
  //       let subsection = 'I18N_DASHBOARD_EXPLORATIONS';

  //       let completedExplorations = learnerDashboardData
  //         .completed_explorations_list.map(
  //           expSummary => LearnerExplorationSummary.createFromBackendDict(
  //             expSummary));

  //       expect(component.startCompletedExpIndex).toBe(0);
  //       expect(component.getVisibleExplorationList(component.startCompletedExpIndex))
  //         .toEqual(completedExplorations.slice(0, 8));

  //       component.goToNextPage(section, subsection);
  //       expect(component.startCompletedExpIndex).toBe(8);
  //       expect(component.getVisibleExplorationList(component.startCompletedExpIndex))
  //         .toEqual(completedExplorations.slice(8));

  //       component.goToPreviousPage(section, subsection);
  //       expect(component.startCompletedExpIndex).toBe(0);
  //       expect(component.getVisibleExplorationList(component.startCompletedExpIndex))
  //         .toEqual(completedExplorations.slice(0, 8));
  //     });

  //   it('should change page when going through pages of completed collections',
  //     () => {
  //       let section = 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION';
  //       let subsection = 'I18N_DASHBOARD_COLLECTIONS';

  //       expect(component.startCompletedCollectionIndex).toBe(0);

  //       component.goToNextPage(section, subsection);
  //       expect(component.startCompletedCollectionIndex).toBe(8);

  //       component.goToPreviousPage(section, subsection);
  //       expect(component.startCompletedCollectionIndex).toBe(0);
  //     });

  //   it('should change explorations sorting options by title when changing' +
  //     ' sorting type', () => {
  //     component.setExplorationsSortingOptions('title');
  //     expect(component.currentExpSortType).toBe('title');
  //     expect(component.isCurrentExpSortDescending).toBe(true);
  //   });

  //   it('should change explorations sorting options by last played when' +
  //     ' changing sorting type', () => {
  //     expect(component.isCurrentExpSortDescending).toBe(true);
  //     expect(component.currentExpSortType).toBe('last_played');
  //     component.setExplorationsSortingOptions('last_played');
  //     expect(component.isCurrentExpSortDescending).toBe(false);
  //   });

  //   it('should change subscription sorting options by username when changing' +
  //     ' sorting type', () => {
  //     expect(component.isCurrentSubscriptionSortDescending).toBe(true);
  //     expect(component.currentSubscribersSortType).toBe('username');
  //     component.setSubscriptionSortingOptions('username');
  //     expect(component.isCurrentSubscriptionSortDescending).toBe(false);
  //   });

  //   it('should change subscription sorting options by impact when changing' +
  //     ' sorting type', () => {
  //     component.setSubscriptionSortingOptions('impact');
  //     expect(component.currentSubscribersSortType).toBe('impact');
  //     expect(component.isCurrentSubscriptionSortDescending).toBe(true);
  //   });

  //   it('should change feedback sorting options by last update msecs when' +
  //     ' changing sorting type', () => {
  //     expect(component.isCurrentFeedbackSortDescending).toBe(true);
  //     expect(component.currentFeedbackThreadsSortType).toBe('lastUpdatedMsecs');
  //     component.setFeedbackSortingOptions('lastUpdatedMsecs');
  //     expect(component.isCurrentFeedbackSortDescending).toBe(false);
  //   });

  //   it('should change feedback sorting options by exploration when changing' +
  //     ' sorting type', () => {
  //     component.setFeedbackSortingOptions('exploration');
  //     expect(component.currentFeedbackThreadsSortType).toBe('exploration');
  //     expect(component.isCurrentFeedbackSortDescending).toBe(true);
  //   });

  //   it('should evaluate value of exploration sort key property as null when' +
  //     ' sorting option is last played', () => {
  //     // The default sort option is exploration last played.
  //     expect(component.currentExpSortType).toBe('last_played');

  //     // The forEach loop is being used here because
  //     // getValueOfExplorationSortKey is used in a ng-repeat directive.
  //     component.completedExplorationsList.forEach(function(exploration) {
  //       expect(component.getValueOfExplorationSortKey(exploration)).toBe(null);
  //     });
  //   });

  //   it('should evaluate value of exploration sort key property as string' +
  //     ' when sorting option is title', () => {
  //     component.setExplorationsSortingOptions('title');
  //     expect(component.currentExpSortType).toBe('title');
  //     component.completedExplorationsList.forEach(function(exploration, index) {
  //       expect(component.getValueOfExplorationSortKey(exploration)).toBe(
  //         'Exploration Title ' + (index + 1));
  //     });
  //   });

  //   it('should evaluate value of subscription sort key property as string' +
  //     ' when sorting option is username', () => {
  //     // The default sort option is exploration last played.
  //     expect(component.currentSubscribersSortType).toBe('username');

  //     // The forEach loop is being used here because
  //     // getValueOfSubscriptionSortKey is used in a ng-repeat directive.
  //     component.subscriptionsList.forEach(function(subscription) {
  //       expect(component.getValueOfSubscriptionSortKey(subscription)).toBe(
  //         'username1');
  //     });

  //     component.setSubscriptionSortingOptions('impact');
  //     expect(component.currentSubscribersSortType).toBe('impact');
  //     component.subscriptionsList.forEach(function(subscription) {
  //       expect(component.getValueOfSubscriptionSortKey(subscription)).toBe(0);
  //     });
  //   });

  //   it('should get messages in the thread from the backend when a thread is' +
  //     ' selected', () => {
  //     let threadStatus = 'open';
  //     let explorationId = 'exp1';
  //     let threadId = 'thread_1';
  //     let explorationTitle = 'Exploration Title';
  //     let threadMessages = [{
  //       message_id: '1',
  //       text: 'Feedback 1',
  //       updated_status: 'open',
  //       suggestion_html: 'An instead of a',
  //       current_content_html: 'A orange',
  //       description: 'Suggestion for english grammar',
  //       author_username: 'username2',
  //       author_picture_data_url: 'foo',
  //       created_on_msecs: 1200
  //     }];

  //     expect(component.numberOfUnreadThreads).toBe(10);

  //     $httpBackend.expect('GET', '/learnerdashboardthreadhandler/thread_1')
  //       .respond({
  //         message_summary_list: threadMessages
  //       });
  //     component.onClickThread(
  //       threadStatus, explorationId, threadId, explorationTitle);

  //     expect(component.loadingFeedbacks).toBe(true);
  //     expect(component.feedbackThreadActive).toBe(true);
  //     expect(component.numberOfUnreadThreads).toBe(9);
  //     $httpBackend.flush();

  //     expect(component.messageSummaries.length).toBe(1);
  //   });

  //   it('should show all threads when a thread is not selected', () => {
  //     let threadStatus = 'open';
  //     let explorationId = 'exp1';
  //     let threadId = 'thread_1';
  //     let explorationTitle = 'Exploration Title';
  //     let threadMessages = [{
  //       message_id: '1',
  //       text: 'Feedback 1',
  //       updated_status: 'open',
  //       suggestion_html: 'An instead of a',
  //       current_content_html: 'A orange',
  //       description: 'Suggestion for english grammar',
  //       author_username: 'username2',
  //       author_picture_data_url: 'foo',
  //       created_on_msecs: 1200
  //     }];

  //     expect(component.numberOfUnreadThreads).toBe(10);

  //     $httpBackend.expect('GET', '/learnerdashboardthreadhandler/thread_1')
  //       .respond({
  //         message_summary_list: threadMessages
  //       });
  //     component.onClickThread(
  //       threadStatus, explorationId, threadId, explorationTitle);
  //     $httpBackend.flush();
  //     expect(component.feedbackThreadActive).toBe(true);

  //     component.showAllThreads();
  //     expect(component.feedbackThreadActive).toBe(false);

  //     expect(component.numberOfUnreadThreads).toBe(9);
  //   });

  //   it('should add a new message in a thread when there is a thread selected',
  //     () => {
  //       let threadStatus = 'open';
  //       let explorationId = 'exp1';
  //       let threadId = 'thread_1';
  //       let explorationTitle = 'Exploration Title';
  //       let threadMessages = [{
  //         message_id: '1',
  //         text: 'Feedback 1',
  //         updated_status: 'open',
  //         suggestion_html: 'An instead of a',
  //         current_content_html: 'A orange',
  //         description: 'Suggestion for english grammar',
  //         author_username: 'username2',
  //         author_picture_data_url: 'foo',
  //         created_on_msecs: 1200
  //       }];

  //       $httpBackend.expect('GET', '/learnerdashboardthreadhandler/thread_1')
  //         .respond({
  //           message_summary_list: threadMessages
  //         });
  //       component.onClickThread(
  //         threadStatus, explorationId, threadId, explorationTitle);
  //       $httpBackend.flush();

  //       let threadId = 'thread_1';
  //       let message = 'This is a new message';
  //       $httpBackend.expect('POST', '/threadhandler/' + threadId).respond(200);
  //       component.addNewMessage(threadId, message);

  //       expect(component.messageSendingInProgress).toBe(true);

  //       $httpBackend.flush();
  //       expect(component.messageSendingInProgress).toBe(false);
  //     });

  //   it('should show new and old content when opening suggestion modal',
  //     () => {
  //       spyOn(SuggestionModalForLearnerDashboardService, 'showSuggestionModal')
  //         .and.returnValue(null);
  //       let newContent = 'New content';
  //       let oldContent = 'Old content';
  //       let description = 'Description';
  //       component.showSuggestionModal(newContent, oldContent, description);

  //       expect(SuggestionModalForLearnerDashboardService.showSuggestionModal)
  //         .toHaveBeenCalledWith('edit_exploration_state_content', {
  //           newContent: newContent,
  //           oldContent: oldContent,
  //           description: description
  //         });
  //     });

  //   it('should open remove activity modal when removing activity', () => {
  //     spyOn($uibModal, 'open').and.callThrough();

  //     let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
  //     let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
  //     let activity = {};
  //     component.openRemoveActivityModal(sectionNameI18nId, subsectionName, activity);

  //     expect($uibModal.open).toHaveBeenCalled();
  //   });

  //   it('should remove an activity from incomplete exploration when closing' +
  //     ' remove activity modal', () => {
  //     spyOn($uibModal, 'open').and.returnValue({
  //       result: Promise.resolve()
  //     });

  //     expect(component.incompleteExplorationsList.length).toBe(12);

  //     let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
  //     let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
  //     // Get exploration with id 13.
  //     let activity = LearnerExplorationSummary.createFromBackendDict(
  //       learnerDashboardData.incomplete_explorations_list[2]);
  //     component.openRemoveActivityModal(sectionNameI18nId, subsectionName, activity);
  //     $scope.$apply();

  //     expect(component.incompleteExplorationsList.length).toBe(11);
  //   });

  //   it('should not remove an activity if its not present', () => {
  //     spyOn($uibModal, 'open').and.returnValue({
  //       result: Promise.resolve()
  //     });

  //     expect(component.incompleteExplorationsList.length).toBe(12);

  //     let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
  //     let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
  //     // Get exploration with id 13.
  //     let activity = LearnerExplorationSummary.createFromBackendDict(
  //       // TODO(#10875): Fix type mismatch.
  //       {
  //         id: '100'
  //       } as unknown as LearnerExplorationSummaryBackendDict);
  //     component.openRemoveActivityModal(sectionNameI18nId, subsectionName, activity);
  //     $scope.$apply();

  //     expect(component.incompleteExplorationsList.length).toBe(12);
  //   });

  //   it('should remove an activity from incomplete collection when closing' +
  //   ' remove activity modal', () => {
  //     spyOn($uibModal, 'open').and.returnValue({
  //       result: Promise.resolve()
  //     });

  //     expect(component.incompleteCollectionsList.length).toBe(8);

  //     let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
  //     let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
  //     // Get collection with id 11.

  //     let activity = CollectionSummary.createFromBackendDict(
  //       learnerDashboardData.incomplete_collections_list[2]);

  //     component.openRemoveActivityModal(
  //       sectionNameI18nId, subsectionName, activity);
  //     $scope.$apply();

  //     expect(component.incompleteCollectionsList.length).toBe(7);
  //   });

  //   it('should remove an activity from exploration playlist when closing' +
  //     ' remove activity modal', () => {
  //     spyOn($uibModal, 'open').and.returnValue({
  //       result: Promise.resolve()
  //     });

  //     expect(component.explorationPlaylist.length).toBe(10);

  //     let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
  //     let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';

  //     // Exploration with id 2.
  //     let activity = LearnerExplorationSummary.createFromBackendDict(
  //       learnerDashboardData.exploration_playlist[1]);

  //     component.openRemoveActivityModal(
  //       sectionNameI18nId, subsectionName, activity);
  //     $scope.$apply();

  //     expect(component.explorationPlaylist.length).toBe(9);
  //   });

  //   it('should remove an activity from collection playlist when closing' +
  //     ' remove activity modal', () => {
  //     spyOn($uibModal, 'open').and.returnValue({
  //       result: Promise.resolve()
  //     });

  //     expect(component.collectionPlaylist.length).toBe(8);

  //     let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
  //     let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
  //     // Get collection with id 2.
  //     let activity = CollectionSummary.createFromBackendDict(
  //       learnerDashboardData.collection_playlist[1]);

  //     component.openRemoveActivityModal(
  //       sectionNameI18nId, subsectionName, activity);
  //     $scope.$apply();

  //     expect(component.collectionPlaylist.length).toBe(7);
  //   });

  //   it('should get css classes based on status', () => {
  //     expect(component.getLabelClass('open')).toBe('badge badge-info');
  //     expect(component.getLabelClass('compliment')).toBe('badge badge-success');
  //     expect(component.getLabelClass('another')).toBe('badge badge-secondary');
  //   });

  //   it('should get human readable status from provided status', () => {
  //     expect(component.getHumanReadableStatus('open')).toBe('Open');
  //     expect(component.getHumanReadableStatus('compliment')).toBe('Compliment');
  //     expect(component.getHumanReadableStatus('not_actionable')).toBe(
  //       'Not Actionable');
  //   });

  //   it('should get formatted date string from the timestamp in milliseconds',
  //     () => {
  //       // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
  //       let NOW_MILLIS = 1416563100000;
  //       spyOn(DateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
  //         .withArgs(NOW_MILLIS).and.returnValue('11/21/2014');
  //       expect(component.getLocaleAbbreviatedDatetimeString(NOW_MILLIS)).toBe(
  //         '11/21/2014');
  //     });
  // });

  // describe('when fetching dashboard data fails', () => {
  //   beforeEach(angular.mock.inject(function($injector, $componentController) {
  //     $httpBackend = $injector.get('$httpBackend');
  //     Promise = $injector.get('Promise');
  //     let $rootScope = $injector.get('$rootScope');
  //     AlertsService = $injector.get('AlertsService');
  //     CsrfTokenService = $injector.get('CsrfTokenService');
  //     LearnerDashboardBackendApiService = $injector.get(
  //       'LearnerDashboardBackendApiService');
  //     UserService = $injector.get('UserService');

  //     spyOn(CsrfTokenService, 'getTokenAsync').and.returnValue(
  //       Promise.resolve('sample-csrf-token'));

  //     spyOn(userService, 'getProfileImageDataUrlAsync')
  //       .and.returnValue(Promise.resolve(profilePictureDataUrl));
  //     spyOn(userService, 'getUserInfoAsync').and.returnValue(
  //       Promise.resolve(userInfo));
  //     spyOn(learnerDashboardBackendApiService, 'fetchLearnerDashboardDataAsync')
  //       .and.returnValue(Promise.reject({
  //         status: 404
  //       }));

  //     $scope = $rootScope.$new();
  //     component = $componentController('learnerDashboardPage', {
  //       $rootScope: $scope
  //     });
  //     component.$onInit();
  //   }));

  //   it('should show an alert warning', () => {
  //     spyOn(AlertsService, 'addWarning').and.callThrough();
  //     $scope.$apply();

  //     expect(AlertsService.addWarning).toHaveBeenCalledWith(
  //       'Failed to get learner dashboard data');
  //   });
  // });

  // describe('when triggering animation', () => {
  //   let $$animateJs = null;

  //   beforeEach(angular.mock.inject(function($injector, $componentController) {
  //     $$animateJs = $injector.get('$$animateJs');
  //     $rootScope = $injector.get('$rootScope');

  //     $scope = $rootScope.$new();
  //     component = $componentController('learnerDashboardPage', {
  //       $rootScope: $scope
  //     });
  //   }));

  //   it('should animate when adding and removing css classes', () => {
  //     let element = angular.element(
  //       '<div class="menu-sub-section"></div>');
  //     let elementSlideUpSpy = spyOn(element, 'slideUp').and.callThrough();
  //     let elementSlideDownSpy = spyOn(element, 'slideDown').and.callThrough();

  //     // $$animateJs is a lower-level service which is used to simulate
  //     // animation behavior.
  //     // eslint-disable-next-line max-len
  //     // Ref: https://stackoverflow.com/questions/33405666/nganimate-1-4-7-unit-test-not-calling-animation-functions
  //     $$animateJs(element, 'addClass', {
  //       addClass: 'ng-hide'
  //     }).start();
  //     expect(elementSlideUpSpy).toHaveBeenCalled();

  //     $$animateJs(element, 'removeClass', {
  //       removeClass: 'ng-hide'
  //     }).start();
  //     expect(elementSlideDownSpy).toHaveBeenCalled();
  //   });
  });
});
