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
import { UpgradedServices } from 'services/UpgradedServices';

require('pages/creator-dashboard-page/creator-dashboard-page.component.ts');

describe('Creator dashboard controller', () => {
  var ctrl = null;
  var $httpBackend = null;
  var $log = null;
  var $q = null;
  var $rootScope = null;
  var $window = null;
  var AlertsService = null;
  var CreatorDashboardBackendApiService = null;
  var CsrfService = null;
  var SuggestionModalForCreatorDashboardService = null;
  var SuggestionThreadObjectFactory = null;
  var ThreadMessageObjectFactory = null;
  var UserService = null;
  var userInfo = {
    canCreateCollections: () => true
  };
  var mockWindow = angular.element(window)[0];
  var resizeEvent = new Event('resize');

  beforeEach(angular.mock.module('oppia', $provide => {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.module('oppia', $provide => {
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(($injector, $componentController) => {
    $httpBackend = $injector.get('$httpBackend');
    $log = $injector.get('$log');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $window = $injector.get('$window');

    AlertsService = $injector.get('AlertsService');
    CreatorDashboardBackendApiService = $injector.get(
      'CreatorDashboardBackendApiService');
    CsrfService = $injector.get('CsrfTokenService');
    SuggestionModalForCreatorDashboardService = $injector.get(
      'SuggestionModalForCreatorDashboardService');
    SuggestionThreadObjectFactory = $injector.get(
      'SuggestionThreadObjectFactory');
    ThreadMessageObjectFactory = $injector.get('ThreadMessageObjectFactory');
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
      get: () => undefined
    });
  }));

  it('should get exploration url successfully', function() {
    var explorationId = '1';
    expect(ctrl.getExplorationUrl(explorationId)).toBe(
      '/create/' + explorationId);
  });

  it('should get collection url successfully', function() {
    var collectionId = '1';
    expect(ctrl.getCollectionUrl(collectionId)).toBe(
      '/collection_editor/create/' + collectionId);
  });

  it('should show username popover according to its length', function() {
    expect(ctrl.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
    expect(ctrl.showUsernamePopover('abc')).toBe('none');
  });

  it('should get complete thumbail icon url', function() {
    expect(ctrl.getCompleteThumbnailIconUrl('/path/to/icon.png')).toBe(
      '/assets/images/path/to/icon.png');
  });

  describe('when fetching dashboard successfully and on explorations tab',
    function() {
      var dashboardData = {
        explorations_list: [{}],
        collections_list: [],
        subscribers_list: [],
        dashboard_stats: {
          total_plays: 10
        },
        last_week_stats: {
          total_plays: 5
        },
        display_preference: [],
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
            new_value: '',
            old_value: '',
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
            new_value: '',
            old_value: '',
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
            new_value: '',
            old_value: '',
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
            new_value: '',
            old_value: '',
          },
          last_updated_msecs: 0
        }]
      };
      var logErrorSpy = null;

      beforeEach(function() {
        spyOn(CreatorDashboardBackendApiService, 'fetchDashboardData')
          .and.returnValue($q.resolve(dashboardData));
        spyOn(UserService, 'getUserInfoAsync').and.returnValue(
          $q.resolve(userInfo));
        logErrorSpy = (
          spyOn($log, 'error').and.callThrough());

        ctrl.$onInit();
        $rootScope.$apply();
      });

      it('should evaluate data from backend', function() {
        var suggestionThreadObject = (
          SuggestionThreadObjectFactory.createFromBackendDicts(
            dashboardData.threads_for_created_suggestions_list[0],
            dashboardData.created_suggestions_list[0]));
        var suggestionToReviewObject = (
          SuggestionThreadObjectFactory.createFromBackendDicts(
            dashboardData.threads_for_suggestions_to_review_list[0],
            dashboardData.suggestions_to_review_list[0]));

        expect(logErrorSpy).toHaveBeenCalledWith(
          'Number of suggestions does not match number of suggestion threads');
        expect(ctrl.canCreateCollections).toBe(true);
        expect(ctrl.mySuggestionsList).toEqual([suggestionThreadObject]);
        expect(ctrl.suggestionsToReviewList).toEqual(
          [suggestionToReviewObject]);
        expect(ctrl.relativeChangeInTotalPlays).toBe(5);
      });

      it('should change active tab name', function() {
        expect(ctrl.activeTab).toBe('myExplorations');
        ctrl.setActiveTab('suggestions');
        expect(ctrl.activeTab).toBe('suggestions');
      });

      it('should set my explorations view correctly', function() {
        $httpBackend.expect('POST', '/creatordashboardhandler/data')
          .respond(200);
        ctrl.setMyExplorationsView('a');
        $httpBackend.flush();

        expect(ctrl.myExplorationsView).toBe('a');
      });

      it('should set explorations sorting options', function() {
        expect(ctrl.isCurrentSortDescending).toBe(true);
        expect(ctrl.currentSortType).toBe('num_open_threads');
        ctrl.setExplorationsSortingOptions('num_open_threads');
        expect(ctrl.isCurrentSortDescending).toBe(false);

        ctrl.setExplorationsSortingOptions('new_open');
        expect(ctrl.currentSortType).toBe('new_open');
      });

      it('should set subscription sorting options', function() {
        expect(ctrl.isCurrentSubscriptionSortDescending).toBe(true);
        expect(ctrl.currentSubscribersSortType).toBe('subscriber_username');
        ctrl.setSubscriptionSortingOptions('subscriber_username');
        expect(ctrl.isCurrentSubscriptionSortDescending).toBe(false);

        ctrl.setSubscriptionSortingOptions('new_subscriber');
        expect(ctrl.currentSubscribersSortType).toBe('new_subscriber');
      });

      it('should sort subscription function', function() {
        var entity = {
          subscriber_username: 'subscriber_username'
        };
        expect(ctrl.sortSubscriptionFunction(entity)).toBe(
          'subscriber_username');

        ctrl.setSubscriptionSortingOptions('subscriber_impact');
        expect(ctrl.sortSubscriptionFunction({})).toBe(0);
      });

      it('should sort by function', function() {
        expect(ctrl.currentSortType).toBe('num_open_threads');
        ctrl.setExplorationsSortingOptions('title');
        expect(ctrl.currentSortType).toBe('title');

        expect(ctrl.sortByFunction({
          title: '',
          status: 'private'
        })).toBe('Untitled');

        ctrl.setExplorationsSortingOptions('num_views');
        expect(ctrl.currentSortType).toBe('num_views');

        expect(ctrl.sortByFunction({
          num_views: '',
          status: 'private'
        })).toBe(0);

        ctrl.setExplorationsSortingOptions('ratings');
        expect(ctrl.currentSortType).toBe('ratings');

        expect(ctrl.sortByFunction({})).toBe(0);

        ctrl.setExplorationsSortingOptions('last_updated_msec');
        expect(ctrl.currentSortType).toBe('last_updated_msec');

        expect(ctrl.sortByFunction({
          last_updated_msec: 1
        })).toBe(1);
      });

      it('should update screen width on window resize', function() {
        var innerWidthSpy = spyOnProperty($window, 'innerWidth', 'get');

        innerWidthSpy.and.returnValue(480);
        mockWindow.dispatchEvent(resizeEvent);

        expect(ctrl.myExplorationsView).toBe('card');
        expect(ctrl.publishText).toBe(
          'Publish the exploration to receive statistics.');

        innerWidthSpy.and.returnValue(768);
        mockWindow.dispatchEvent(resizeEvent);

        expect(ctrl.myExplorationsView).toBe('card');
        expect(ctrl.publishText).toBe(
          'This exploration is private. Publish it to receive statistics.');
      });

      it('should set active thread from my suggestions list', function() {
        var threadId = 'exp1';
        var messages = [{
          author_username: '',
          created_om_msecs: 0,
          entity_type: '',
          entity_id: '',
          message_id: '',
          text: '',
          updated_status: '',
          updated_subject: '',
        }];
        var suggestionThreadObject = (
          SuggestionThreadObjectFactory.createFromBackendDicts(
            dashboardData.threads_for_created_suggestions_list[0],
            dashboardData.created_suggestions_list[0]));
        suggestionThreadObject.setMessages(messages.map(m => (
          ThreadMessageObjectFactory.createFromBackendDict(m))));

        $httpBackend.expect('GET', '/threadhandler/' + threadId).respond({
          messages: messages
        });
        ctrl.setActiveThread(threadId);
        $httpBackend.flush();

        expect(ctrl.activeThread).toEqual(suggestionThreadObject);
        expect(ctrl.canReviewActiveThread).toBe(false);
      });

      it('should set active thread from suggestions to review list',
        function() {
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

      it('should open suggestion modal', function() {
        var threadId = 'exp1';

        $httpBackend.expect('GET', '/threadhandler/' + threadId).respond(404);
        ctrl.setActiveThread(threadId);
        $httpBackend.flush();

        spyOn(SuggestionModalForCreatorDashboardService, 'showSuggestionModal')
          .and.callThrough();
        ctrl.showSuggestionModal();

        expect(SuggestionModalForCreatorDashboardService.showSuggestionModal)
          .toHaveBeenCalled();
      });
    });

  describe('when on collections tab', function() {
    var dashboardData = {
      explorations_list: [],
      collections_list: [{}],
      subscribers_list: [],
      dashboard_stats: {},
      last_week_stats: {},
      display_preference: [],
      threads_for_created_suggestions_list: [],
      created_suggestions_list: [],
      threads_for_suggestions_to_review_list: [],
      suggestions_to_review_list: []
    };

    beforeEach(function() {
      spyOn(CreatorDashboardBackendApiService, 'fetchDashboardData')
        .and.returnValue($q.resolve(dashboardData));

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
      dashboard_stats: {},
      last_week_stats: {},
      display_preference: [],
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
        state_name: '',
        new_value: '',
        old_value: '',
        last_updated_msecs: 0
      }],
      threads_for_suggestions_to_review_list: [],
      suggestions_to_review_list: []
    };

    beforeEach(function() {
      spyOn(CreatorDashboardBackendApiService, 'fetchDashboardData')
        .and.returnValue($q.resolve(dashboardData));

      ctrl.$onInit();
      $rootScope.$apply();
    });

    it('should evaluate active tab', function() {
      expect(ctrl.activeTab).toBe('suggestions');
    });
  });

  describe('when fetching dashboard fails', function() {
    it('should use reject handler', function() {
      spyOn(CreatorDashboardBackendApiService, 'fetchDashboardData')
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
