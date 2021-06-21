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
 * @fileoverview Unit tests for creator dashboard page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// creator-dashboard-page.component.ts is upgraded to Angular 8.
import { CollectionSummary, CollectionSummaryBackendDict } from 'domain/collection/collection-summary.model';
import { CreatorDashboardStats } from 'domain/creator_dashboard/creator-dashboard-stats.model';
import { CreatorExplorationSummary } from 'domain/summary/creator-exploration-summary.model';
import { ProfileSummary } from 'domain/user/profile-summary.model';
import { Suggestion } from 'domain/suggestion/suggestion.model';
import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';
import { importAllAngularServices } from 'tests/unit-test-utils';

require('pages/creator-dashboard-page/creator-dashboard-page.component.ts');

var _getSuggestionThreads = (
    feedbackDicts, suggestionDicts, suggestionsService,
    suggestionThreadObjectFactory) => {
  var numberOfSuggestions = feedbackDicts.length;
  var suggestionThreads = [];

  for (var i = 0; i < numberOfSuggestions; i++) {
    for (var j = 0; j < numberOfSuggestions; j++) {
      var suggestionThreadId = suggestionsService
        .getThreadIdFromSuggestionBackendDict(suggestionDicts[j]);
      var threadDict = feedbackDicts[i];
      if (threadDict.thread_id === suggestionThreadId) {
        var suggestionThread = (
          suggestionThreadObjectFactory.createFromBackendDicts(
            threadDict, suggestionDicts[j]));
        suggestionThreads.push(suggestionThread);
      }
    }
  }

  return suggestionThreads;
};

describe('Creator dashboard controller', () => {
  var ctrl = null;
  var $httpBackend = null;
  var $q = null;
  var $rootScope = null;
  var $window = null;
  var AlertsService = null;
  var CreatorDashboardBackendApiService = null;
  var CsrfService = null;
  var feedbackThreadObjectFactory = null;
  var SuggestionModalForCreatorDashboardService = null;
  var suggestionsService = null;
  var SuggestionThreadObjectFactory = null;
  var UserService = null;
  var explorationCreationService = null;
  var userInfo = {
    canCreateCollections: () => true
  };

  importAllAngularServices();

  beforeEach(angular.mock.inject(($injector, $componentController) => {
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $window = $injector.get('$window');

    AlertsService = $injector.get('AlertsService');
    CreatorDashboardBackendApiService = $injector.get(
      'CreatorDashboardBackendApiService');
    CsrfService = $injector.get('CsrfTokenService');
    feedbackThreadObjectFactory = $injector.get(
      'FeedbackThreadObjectFactory');
    SuggestionModalForCreatorDashboardService = $injector.get(
      'SuggestionModalForCreatorDashboardService');
    suggestionsService = $injector.get(
      'SuggestionsService');
    explorationCreationService = $injector.get('ExplorationCreationService');
    SuggestionThreadObjectFactory = $injector.get(
      'SuggestionThreadObjectFactory');
    UserService = $injector.get('UserService');

    spyOn(CsrfService, 'getTokenAsync').and.returnValue(
      $q.resolve('sample-csrf-token'));

    ctrl = $componentController('creatorDashboardPage');

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property innerWidth does not have access type get' error.
    // eslint-disable-next-line max-len
    // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
    // ref: https://github.com/jasmine/jasmine/issues/1415
    Object.defineProperty($window, 'innerWidth', {
      get: () => undefined,
      set: () => {}
    });
  }));

  it('should get the correct exploration editor page URL corresponding to a' +
    ' given exploration ID', function() {
    var explorationId = '1';
    expect(ctrl.getExplorationUrl(explorationId)).toBe(
      '/create/' + explorationId);
  });

  it('should get the correct collection editor page URL corresponding to a' +
    ' given collection ID', function() {
    var collectionId = '1';
    expect(ctrl.getCollectionUrl(collectionId)).toBe(
      '/collection_editor/create/' + collectionId);
  });

  it('should get username popover event type according to username length',
    function() {
      expect(ctrl.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
      expect(ctrl.showUsernamePopover('abc')).toBe('none');
    });

  it('should get complete thumbail icon path corresponding to a given' +
    ' relative path', function() {
    expect(ctrl.getCompleteThumbnailIconUrl('/path/to/icon.png')).toBe(
      '/assets/images/path/to/icon.png');
  });

  it('should create new exploration when clicked on CREATE' +
   ' EXPLORATION button', function() {
    spyOn(
      explorationCreationService, 'createNewExploration');
    ctrl.createNewExploration();
    expect(
      explorationCreationService.createNewExploration).toHaveBeenCalled();
  });

  describe('when fetching dashboard successfully and on explorations tab',
    function() {
      var dashboardData = {
        explorations_list: [
          {
            human_readable_contributors_summary: {
              username: {
                num_commits: 3
              }
            },
            category: 'Algebra',
            community_owned: false,
            tags: [],
            title: 'Testing Exploration',
            created_on_msec: 1593786508029.501,
            num_total_threads: 0,
            num_views: 1,
            last_updated_msec: 1593786607552.753,
            status: 'public',
            num_open_threads: 0,
            thumbnail_icon_url: '/subjects/Algebra.svg',
            language_code: 'en',
            objective: 'To test exploration recommendations',
            id: 'hi27Jix1QGbT',
            thumbnail_bg_color: '#cd672b',
            activity_type: 'exploration',
            ratings: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0
            }
          }
        ],
        collections_list: [],
        subscribers_list: [],
        dashboard_stats: {
          average_ratings: null,
          num_ratings: 0,
          total_open_feedback: 0,
          total_plays: 10
        },
        last_week_stats: {
          average_ratings: null,
          num_ratings: 0,
          total_open_feedback: 0,
          total_plays: 5
        },
        display_preference: 'card',
        threads_for_created_suggestions_list: [{
          status: '',
          subject: '',
          summary: '',
          original_author_username: '',
          last_updated_msecs: 0,
          message_count: '',
          thread_id: 'exp1',
          last_nonempty_message_author: '',
          last_nonempty_message_text: '',
        }],
        created_suggestions_list: [{
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: 'exp1',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change: {
            state_name: '',
            new_value: { html: ''},
            old_value: { html: ''},
          },
          last_updated_msecs: 0
        }, {
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: 'exp2',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change: {
            state_name: '',
            new_value: { html: ''},
            old_value: { html: ''},
          },
          last_updated_msecs: 0
        }],
        threads_for_suggestions_to_review_list: [{
          status: '',
          subject: '',
          summary: '',
          original_author_username: '',
          last_updated_msecs: 0,
          message_count: '',
          thread_id: 'exp2',
          last_nonempty_message_author: '',
          last_nonempty_message_text: '',
        }],
        suggestions_to_review_list: [{
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: 'exp2',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change: {
            state_name: '',
            new_value: { html: ''},
            old_value: { html: ''},
          },
          last_updated_msecs: 0
        }, {
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: 'exp1',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change: {
            state_name: '',
            new_value: { html: ''},
            old_value: { html: ''},
          },
          last_updated_msecs: 0
        }]
      };

      beforeEach(function() {
        spyOn(CreatorDashboardBackendApiService, 'fetchDashboardDataAsync')
          .and.returnValue($q.resolve({
            dashboardStats: CreatorDashboardStats
              .createFromBackendDict(dashboardData.dashboard_stats),
            // Because lastWeekStats may be null.
            lastWeekStats: dashboardData.last_week_stats ? (
              CreatorDashboardStats
                .createFromBackendDict(dashboardData.last_week_stats)) : null,
            displayPreference: dashboardData.display_preference,
            subscribersList: dashboardData.subscribers_list.map(
              subscriber => ProfileSummary
                .createFromSubscriberBackendDict(subscriber)),
            threadsForCreatedSuggestionsList: (
              dashboardData.threads_for_created_suggestions_list.map(
                feedbackThread => feedbackThreadObjectFactory
                  .createFromBackendDict(feedbackThread))),
            threadsForSuggestionsToReviewList: (
              dashboardData.threads_for_suggestions_to_review_list.map(
                feedbackThread => feedbackThreadObjectFactory
                  .createFromBackendDict(feedbackThread))),
            createdSuggestionsList: (
              dashboardData.created_suggestions_list.map(
                suggestionDict => Suggestion.createFromBackendDict(
                  suggestionDict
                ))),
            suggestionsToReviewList: (
              dashboardData.suggestions_to_review_list.map(
                suggestionDict => Suggestion.createFromBackendDict(
                  suggestionDict
                ))),
            createdSuggestionThreadsList: _getSuggestionThreads(
              dashboardData.threads_for_created_suggestions_list,
              dashboardData.created_suggestions_list,
              suggestionsService,
              SuggestionThreadObjectFactory),
            suggestionThreadsToReviewList: _getSuggestionThreads(
              dashboardData.threads_for_suggestions_to_review_list,
              dashboardData.suggestions_to_review_list,
              suggestionsService,
              SuggestionThreadObjectFactory),
            explorationsList: dashboardData.explorations_list.map(
              expSummary => CreatorExplorationSummary
                .createFromBackendDict(expSummary)),
            collectionsList: dashboardData.collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))
          }));
        spyOn(UserService, 'getUserInfoAsync').and.returnValue(
          $q.resolve(userInfo));

        ctrl.$onInit();
        $rootScope.$apply();
      });

      it('should evaluate dashboard data retrieved from backend', function() {
        var suggestionThreadObject = (
          SuggestionThreadObjectFactory.createFromBackendDicts(
            dashboardData.threads_for_created_suggestions_list[0],
            dashboardData.created_suggestions_list[0]));
        var suggestionToReviewObject = (
          SuggestionThreadObjectFactory.createFromBackendDicts(
            dashboardData.threads_for_suggestions_to_review_list[0],
            dashboardData.suggestions_to_review_list[0]));

        expect(ctrl.canCreateCollections).toBe(true);
        expect(ctrl.mySuggestionsList).toEqual([suggestionThreadObject]);
        expect(ctrl.suggestionsToReviewList).toEqual(
          [suggestionToReviewObject]);
        expect(ctrl.relativeChangeInTotalPlays).toBe(5);
      });

      it('should change active tab name when creator clicks on a new tab',
        function() {
          expect(ctrl.activeTab).toBe('myExplorations');
          ctrl.setActiveTab('suggestions');
          expect(ctrl.activeTab).toBe('suggestions');
        });

      it('should save the exploration format view in the backend when creator' +
        ' changes the format view', function() {
        $httpBackend.expect('POST', '/creatordashboardhandler/data')
          .respond(200);
        ctrl.setMyExplorationsView('a');
        $httpBackend.flush();

        expect(ctrl.myExplorationsView).toBe('a');
      });

      it('should reverse the sort order of explorations when the creator' +
        ' re-selects the current sorting type', function() {
        expect(ctrl.isCurrentSortDescending).toBe(true);
        expect(ctrl.currentSortType).toBe('numOpenThreads');
        ctrl.setExplorationsSortingOptions('numOpenThreads');
        expect(ctrl.isCurrentSortDescending).toBe(false);
      });

      it('should update the exploration sort order based on the' +
        ' option chosen by the creator', function() {
        ctrl.setExplorationsSortingOptions('new_open');
        expect(ctrl.currentSortType).toBe('new_open');
      });

      it('should reverse the sort order of subscriptions when the creator' +
        ' re-selects the current sorting type', function() {
        expect(ctrl.isCurrentSubscriptionSortDescending).toBe(true);
        expect(ctrl.currentSubscribersSortType).toBe('username');
        ctrl.setSubscriptionSortingOptions('username');
        expect(ctrl.isCurrentSubscriptionSortDescending).toBe(false);
      });

      it('should update the subscription sort order based on the' +
        ' option chosen by the creator', function() {
        ctrl.setSubscriptionSortingOptions('new_subscriber');
        expect(ctrl.currentSubscribersSortType).toBe('new_subscriber');
      });

      it('should sort subscription list by username', function() {
        var entity = {
          username: 'username'
        };
        expect(ctrl.currentSubscribersSortType).toBe('username');
        expect(ctrl.sortSubscriptionFunction(entity)).toBe(
          'username');
      });

      it('should not sort subscription list by impact given empty object',
        function() {
          ctrl.setSubscriptionSortingOptions('impact');
          expect(ctrl.currentSubscribersSortType).toBe('impact');
          expect(ctrl.sortSubscriptionFunction({})).toBe(0);
        });

      it('should sort exploration list by untitled explorations when title' +
        ' is not provided and exploration is private', function() {
        expect(ctrl.currentSortType).toBe('numOpenThreads');
        ctrl.setExplorationsSortingOptions('title');
        expect(ctrl.currentSortType).toBe('title');

        expect(ctrl.sortByFunction({
          title: '',
          status: 'private'
        })).toBe('Untitled');
      });

      it('should not sort exploration list by rating when providing' +
        ' a empty object', function() {
        ctrl.setExplorationsSortingOptions('ratings');
        expect(ctrl.currentSortType).toBe('ratings');

        expect(ctrl.sortByFunction({})).toBe(0);
      });

      it('should sort exploration list by last updated when last updated' +
        ' value is provided', function() {
        ctrl.setExplorationsSortingOptions('lastUpdatedMsec');
        expect(ctrl.currentSortType).toBe('lastUpdatedMsec');

        expect(ctrl.sortByFunction({
          lastUpdatedMsec: 1
        })).toBe(1);
      });

      it('should not sort exploration list by options that is not last update' +
        ' when trying to sort by number of views', function() {
        ctrl.setExplorationsSortingOptions('numViews');
        expect(ctrl.currentSortType).toBe('numViews');

        expect(ctrl.sortByFunction({
          numViews: '',
          status: 'private'
        })).toBe(0);
      });

      it('should update exploration view and publish text on resizing page',
        function() {
          var innerWidthSpy = spyOnProperty($window, 'innerWidth');
          $httpBackend.expect('POST', '/creatordashboardhandler/data').respond(
            200);
          ctrl.setMyExplorationsView('list');
          $httpBackend.flush();

          expect(ctrl.myExplorationsView).toBe('list');

          innerWidthSpy.and.callFake(() => 480);
          $rootScope.$apply();
          angular.element($window).triggerHandler('resize');

          expect(ctrl.myExplorationsView).toBe('card');
          expect(ctrl.publishText).toBe(
            'Publish the exploration to receive statistics.');

          innerWidthSpy.and.callFake(() => 768);
          $rootScope.$apply();
          angular.element($window).triggerHandler('resize');

          expect(ctrl.myExplorationsView).toBe('list');
          expect(ctrl.publishText).toBe(
            'This exploration is private. Publish it to receive statistics.');
        });

      it('should set active thread from my suggestions list when changing' +
        ' active thread', function() {
        var threadId = 'exp1';
        var messages = [{
          author_username: '',
          created_on_msecs: 0,
          entity_type: '',
          entity_id: '',
          message_id: 0,
          text: '',
          updated_status: '',
          updated_subject: '',
        }];
        var suggestionThreadObject = (
          SuggestionThreadObjectFactory.createFromBackendDicts(
            dashboardData.threads_for_created_suggestions_list[0],
            dashboardData.created_suggestions_list[0]));
        suggestionThreadObject.setMessages(messages.map(m => (
          ThreadMessage.createFromBackendDict(m))));

        $httpBackend.expect('GET', '/threadhandler/' + threadId).respond({
          messages: messages
        });
        ctrl.setActiveThread(threadId);
        $httpBackend.flush();

        expect(ctrl.activeThread).toEqual(suggestionThreadObject);
        expect(ctrl.canReviewActiveThread).toBe(false);
      });

      it('should set active thread from suggestions to review list' +
        ' when cleaning active thread', function() {
        var threadId = 'exp2';
        var suggestionToReviewObject = (
          SuggestionThreadObjectFactory.createFromBackendDicts(
            dashboardData.threads_for_suggestions_to_review_list[0],
            dashboardData.suggestions_to_review_list[0]));

        ctrl.clearActiveThread();

        $httpBackend.expect('GET', '/threadhandler/' + threadId).respond(404);
        ctrl.setActiveThread(threadId);
        $httpBackend.flush();

        expect(ctrl.activeThread).toEqual(suggestionToReviewObject);
        expect(ctrl.canReviewActiveThread).toBe(true);
      });

      it('should open suggestion modal when clicking on show suggestion modal',
        function() {
          var threadId = 'exp1';

          $httpBackend.expect('GET', '/threadhandler/' + threadId).respond(404);
          ctrl.setActiveThread(threadId);
          $httpBackend.flush();

          // Method showSuggestionModal is mocked otherwise using its original
          // implementation will throw an error: 'appendTo element not found.
          // Make sure that the element passed is in DOM.'
          // This error does not happen often and it's related to the usage of
          // angular.element in above specs.
          spyOn(
            SuggestionModalForCreatorDashboardService, 'showSuggestionModal')
            .and.callFake(() => {});
          ctrl.showSuggestionModal();

          expect(SuggestionModalForCreatorDashboardService.showSuggestionModal)
            .toHaveBeenCalled();
        });
    });

  describe('when on collections tab', function() {
    var dashboardData = {
      explorations_list: [],
      collections_list: [{
        last_updated: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        thumbnail_icon_url: '/subjects/Algebra.svg',
        language_code: 'en',
        thumbnail_bg_color: '#cd672b',
        created_on: 1591296635736.666,
        status: 'public',
        category: 'Algebra',
        title: 'Test Title',
        node_count: 0
      }],
      subscribers_list: [],
      dashboard_stats: {
        average_ratings: null,
        num_ratings: 0,
        total_open_feedback: 0,
        total_plays: 10
      },
      last_week_stats: null,
      display_preference: [],
      threads_for_created_suggestions_list: [],
      created_suggestions_list: [],
      threads_for_suggestions_to_review_list: [],
      suggestions_to_review_list: []
    };

    beforeEach(function() {
      spyOn(CreatorDashboardBackendApiService, 'fetchDashboardDataAsync')
        .and.returnValue($q.resolve({
          dashboardStats: CreatorDashboardStats
            .createFromBackendDict(dashboardData.dashboard_stats),
          // Because lastWeekStats may be null.
          lastWeekStats: dashboardData.last_week_stats ? (
            CreatorDashboardStats
              .createFromBackendDict(dashboardData.last_week_stats)) : null,
          displayPreference: dashboardData.display_preference,
          subscribersList: dashboardData.subscribers_list.map(
            subscriber => ProfileSummary
              .createFromSubscriberBackendDict(subscriber)),
          threadsForCreatedSuggestionsList: (
            dashboardData.threads_for_created_suggestions_list.map(
              feedbackThread => feedbackThreadObjectFactory
                .createFromBackendDict(feedbackThread))),
          threadsForSuggestionsToReviewList: (
            dashboardData.threads_for_suggestions_to_review_list.map(
              feedbackThread => feedbackThreadObjectFactory
                .createFromBackendDict(feedbackThread))),
          createdSuggestionsList: (
            dashboardData.created_suggestions_list.map(
              suggestionDict => Suggestion.createFromBackendDict(
                suggestionDict
              ))),
          suggestionsToReviewList: (
            dashboardData.suggestions_to_review_list.map(
              suggestionDict => Suggestion.createFromBackendDict(
                suggestionDict
              ))),
          createdSuggestionThreadsList: _getSuggestionThreads(
            dashboardData.threads_for_created_suggestions_list,
            dashboardData.created_suggestions_list,
            suggestionsService,
            SuggestionThreadObjectFactory),
          suggestionThreadsToReviewList: _getSuggestionThreads(
            dashboardData.threads_for_suggestions_to_review_list,
            dashboardData.suggestions_to_review_list,
            suggestionsService,
            SuggestionThreadObjectFactory),
          explorationsList: dashboardData.explorations_list.map(
            expSummary => CreatorExplorationSummary
              .createFromBackendDict(expSummary)),
          collectionsList: dashboardData.collections_list.map(
            (collectionSummary: unknown) => CollectionSummary
              .createFromBackendDict(
                collectionSummary as CollectionSummaryBackendDict))
        }));

      ctrl.$onInit();
      $rootScope.$apply();
    });

    it('should evaluate active tab', function() {
      expect(ctrl.activeTab).toBe('myCollections');
    });
  });

  describe('when on suggestions tab', function() {
    var dashboardData = {
      explorations_list: [],
      collections_list: [],
      subscribers_list: [],
      dashboard_stats: {
        average_ratings: null,
        num_ratings: 0,
        total_open_feedback: 0,
        total_plays: 10
      },
      last_week_stats: null,
      display_preference: '',
      threads_for_created_suggestions_list: [{
        status: '',
        subject: '',
        summary: '',
        original_author_username: '',
        last_updated_msecs: 0,
        message_count: '',
        thread_id: 'exp1',
        last_nonempty_message_author: '',
        last_nonempty_message_text: '',
      }],
      created_suggestions_list: [{
        suggestion_type: 'testing',
        suggestion_id: 'exp1',
        target_type: '',
        target_id: '',
        status: '',
        author_name: '',
        change: {
          state_name: '',
          new_value: { html: ''},
          old_value: { html: ''},
        },
        last_updated_msecs: 0
      }],
      threads_for_suggestions_to_review_list: [],
      suggestions_to_review_list: []
    };

    beforeEach(function() {
      spyOn(CreatorDashboardBackendApiService, 'fetchDashboardDataAsync')
        .and.returnValue($q.resolve({
          dashboardStats: CreatorDashboardStats
            .createFromBackendDict(dashboardData.dashboard_stats),
          // Because lastWeekStats may be null.
          lastWeekStats: dashboardData.last_week_stats ? (
            CreatorDashboardStats
              .createFromBackendDict(dashboardData.last_week_stats)) : null,
          displayPreference: dashboardData.display_preference,
          subscribersList: dashboardData.subscribers_list.map(
            subscriber => ProfileSummary
              .createFromSubscriberBackendDict(subscriber)),
          threadsForCreatedSuggestionsList: (
            dashboardData.threads_for_created_suggestions_list.map(
              feedbackThread => feedbackThreadObjectFactory
                .createFromBackendDict(feedbackThread))),
          threadsForSuggestionsToReviewList: (
            dashboardData.threads_for_suggestions_to_review_list.map(
              feedbackThread => feedbackThreadObjectFactory
                .createFromBackendDict(feedbackThread))),
          createdSuggestionsList: (
            dashboardData.created_suggestions_list.map(
              suggestionDict => Suggestion.createFromBackendDict(
                suggestionDict
              ))),
          suggestionsToReviewList: (
            dashboardData.suggestions_to_review_list.map(
              suggestionDict => Suggestion.createFromBackendDict(
                suggestionDict
              ))),
          createdSuggestionThreadsList: _getSuggestionThreads(
            dashboardData.threads_for_created_suggestions_list,
            dashboardData.created_suggestions_list,
            suggestionsService,
            SuggestionThreadObjectFactory),
          suggestionThreadsToReviewList: _getSuggestionThreads(
            dashboardData.threads_for_suggestions_to_review_list,
            dashboardData.suggestions_to_review_list,
            suggestionsService,
            SuggestionThreadObjectFactory),
          explorationsList: dashboardData.explorations_list.map(
            expSummary => CreatorExplorationSummary
              .createFromBackendDict(expSummary)),
          collectionsList: dashboardData.collections_list.map(
            collectionSummary => CollectionSummary
              .createFromBackendDict(collectionSummary))
        }));

      ctrl.$onInit();
      $rootScope.$apply();
    });

    it('should evaluate active tab', function() {
      expect(ctrl.activeTab).toBe('suggestions');
    });
  });

  describe('when fetching dashboard fails', function() {
    it('should use reject handler', function() {
      spyOn(CreatorDashboardBackendApiService, 'fetchDashboardDataAsync')
        .and.returnValue($q.reject({
          status: 404
        }));
      spyOn(AlertsService, 'addWarning').and.callThrough();

      ctrl.$onInit();
      $rootScope.$apply();
      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get dashboard data');
    });
  });
});
