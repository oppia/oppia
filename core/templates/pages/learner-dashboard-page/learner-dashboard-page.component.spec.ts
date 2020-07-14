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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'pages/learner-dashboard-page/learner-dashboard-page.component.ts');

describe('Learner dashboard page', function() {
  var ctrl = null;
  var $httpBackend = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var $window = null;
  var AlertsService = null;
  var CollectionObjectFactory = null;
  var collectionSummaryObjectFactory = null;
  var CsrfTokenService = null;
  var DateTimeFormatService = null;
  var ExplorationObjectFactory = null;
  var feedbackThreadSummaryObjectFactory = null;
  var LearnerDashboardBackendApiService = null;
  var learnerExplorationSummaryObjectFactory = null;
  var nonExistentActivitiesObjectFactory = null;
  var profileSummaryObjectFactory = null;
  var SuggestionModalForLearnerDashboardService = null;
  var UserService = null;

  var profilePictureDataUrl = 'profile-picture-url';
  var userInfo = {
    getUsername: () => 'username1'
  };
  var learnerDashboardData = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  describe('when succesfully fetching learner dashboard data', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      $window = $injector.get('$window');
      CollectionObjectFactory = $injector.get('CollectionObjectFactory');
      collectionSummaryObjectFactory = $injector.get(
        'CollectionSummaryObjectFactory');
      CsrfTokenService = $injector.get('CsrfTokenService');
      DateTimeFormatService = $injector.get('DateTimeFormatService');
      ExplorationObjectFactory = $injector.get('ExplorationObjectFactory');
      feedbackThreadSummaryObjectFactory = $injector.get(
        'FeedbackThreadSummaryObjectFactory');
      LearnerDashboardBackendApiService = $injector.get(
        'LearnerDashboardBackendApiService');
      learnerExplorationSummaryObjectFactory = $injector.get(
        'LearnerExplorationSummaryObjectFactory');
      nonExistentActivitiesObjectFactory = $injector.get(
        'NonExistentActivitiesObjectFactory');
      profileSummaryObjectFactory = $injector.get(
        'ProfileSummaryObjectFactory');
      SuggestionModalForLearnerDashboardService = $injector.get(
        'SuggestionModalForLearnerDashboardService');
      UserService = $injector.get('UserService');

      spyOn(CsrfTokenService, 'getTokenAsync').and.returnValue(
        $q.resolve('sample-csrf-token'));

      var explorationDict = {
        init_state_name: 'Introduction',
        language_code: 'en',
        states: {
          Introduction: {
            param_changes: [],
            content: {
              html: '',
              audio_translations: {}
            },
            recorded_voiceovers: {
              voiceovers_mapping: {}
            },
            written_translations: {
              translations_mapping: {}
            },
            unresolved_answers: {},
            interaction: {
              customization_args: {},
              answer_groups: [],
              default_outcome: {
                param_changes: [],
                dest: 'Introduction',
                feedback: {
                  html: '',
                  audio_translations: {}
                }
              },
              hints: [],
              confirmed_unclassified_answers: [],
              id: null
            }
          }
        },
        param_changes: [],
        param_specs: {},
        version: 1
      };
      var collectionDict = {
        objective: '',
        category: '',
        version: '0',
        nodes: [],
        playthrough_dict: {
          next_exploration_id: 'expId',
          completed_exploration_ids: ['expId2']
        }
      };
      learnerDashboardData = {
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

      // Generate completed explorations and exploration playlist.
      for (let i = 0; i < 10; i++) {
        learnerDashboardData.completed_explorations_list[i] = (
          ExplorationObjectFactory.createFromBackendDict(
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
          ExplorationObjectFactory.createFromBackendDict(
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
          CollectionObjectFactory.create(
            Object.assign(collectionDict, {
              id: i + 1,
              title: 'Collection Title ' + (i + 1),
            })
          ));
        learnerDashboardData.collection_playlist[i] = ({
          id: Number(i + 1).toString()
        });
      }

      // Generate incomplete collections.
      for (let i = 0; i < 8; i++) {
        learnerDashboardData.incomplete_collections_list[i] = (
          CollectionObjectFactory.create(
            Object.assign(collectionDict, {
              // Create ids from 9 to 17.
              // (0 to 8 is the complete collections).
              id: i + 10,
              title: 'Collection Title ' + (i + 7),
            })
          ));
      }

      spyOn(UserService, 'getProfileImageDataUrlAsync').and.returnValue(
        $q.resolve(profilePictureDataUrl));
      spyOn(UserService, 'getUserInfoAsync').and.returnValue($q.resolve(
        userInfo));
      spyOn(LearnerDashboardBackendApiService, 'fetchLearnerDashboardData')
        .and.returnValue($q.resolve({
          completedExplorationsList: (
            learnerDashboardData.completed_explorations_list.map(
              expSummary => learnerExplorationSummaryObjectFactory
                .createFromBackendDict(expSummary))),
          incompleteExplorationsList: (
            learnerDashboardData.incomplete_explorations_list.map(
              expSummary => learnerExplorationSummaryObjectFactory
                .createFromBackendDict(expSummary))),
          explorationPlaylist: (
            learnerDashboardData.exploration_playlist.map(
              expSummary => learnerExplorationSummaryObjectFactory
                .createFromBackendDict(expSummary))),
          completedCollectionsList: (
            learnerDashboardData.completed_collections_list.map(
              collectionSummary => collectionSummaryObjectFactory
                .createFromBackendDict(collectionSummary))),
          incompleteCollectionsList: (
            learnerDashboardData.incomplete_collections_list.map(
              collectionSummary => collectionSummaryObjectFactory
                .createFromBackendDict(collectionSummary))),
          collectionPlaylist: (
            learnerDashboardData.collection_playlist.map(
              collectionSummary => collectionSummaryObjectFactory
                .createFromBackendDict(collectionSummary))),
          numberOfUnreadThreads: learnerDashboardData.number_of_unread_threads,
          threadSummaries: (
            learnerDashboardData.thread_summaries.map(
              threadSummary => feedbackThreadSummaryObjectFactory
                .createFromBackendDict(threadSummary))),
          completedToIncompleteCollections: (
            learnerDashboardData.completed_to_incomplete_collections),
          numberOfNonexistentActivities: (
            nonExistentActivitiesObjectFactory.createFromBackendDict(
              learnerDashboardData.number_of_nonexistent_activities)),
          subscriptionList: (
            learnerDashboardData.subscription_list.map(
              profileSummary => profileSummaryObjectFactory
                .createFromCreatorBackendDict(profileSummary)))
        }));

      $scope = $rootScope.$new();
      ctrl = $componentController('learnerDashboardPage', {
        $rootScope: $scope
      });
      ctrl.$onInit();
      $scope.$apply();
    }));

    it('should evaluate information get from backend', function() {
      expect(ctrl.profilePictureDataUrl).toBe(profilePictureDataUrl);
      expect(ctrl.username).toBe(userInfo.getUsername());

      expect(ctrl.noExplorationActivity).toBe(false);
      expect(ctrl.noCollectionActivity).toBe(false);
      expect(ctrl.noActivity).toBe(false);
    });

    it('should start collection playlist sortable options', function() {
      var mockedUi = {
        placeholder: {
          height: (setHeight) => {
            if (setHeight) {
              return setHeight;
            }
            return 0;
          }
        },
        item: {
          height: () => 50
        }
      };
      spyOn(mockedUi.placeholder, 'height').and.callThrough();

      ctrl.collectionPlaylistSortableOptions.start(null, mockedUi);
      expect(mockedUi.placeholder.height).toHaveBeenCalled();
    });

    it('should sort collection playlist sortable options', function() {
      var mockedUi = {
        helper: {
          css: () => {}
        }
      };
      spyOn(mockedUi.helper, 'css').and.callThrough();

      ctrl.collectionPlaylistSortableOptions.stop(null, null);
      ctrl.collectionPlaylistSortableOptions.sort(null, mockedUi);
      expect(mockedUi.helper.css).toHaveBeenCalledWith({top: '0 px'});
    });

    it('should update collection playlist sortable options', function() {
      var mockedUi = {
        item: {
          sortable: {
            index: 1
          }
        }
      };
      $httpBackend.expect(
        'POST', '/learnerplaylistactivityhandler/collection/' +
        (mockedUi.item.sortable.index + 1)).respond(200);
      ctrl.collectionPlaylistSortableOptions.update(null, mockedUi);
      $httpBackend.flush();

      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should update exploration playlist sortable options', function() {
      var mockedUi = {
        item: {
          sortable: {
            index: 1
          }
        }
      };
      $httpBackend.expect(
        'POST', '/learnerplaylistactivityhandler/exploration/' +
        (mockedUi.item.sortable.index + 1)).respond(200);
      ctrl.explorationPlaylistSortableOptions.update(null, mockedUi);
      $httpBackend.flush();

      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should get static image url', function() {
      var imagePath = '/path/to/image.png';
      expect(ctrl.getStaticImageUrl(imagePath)).toBe(
        '/assets/images/path/to/image.png');
    });

    it('should set active section successfully', function() {
      var threadStatus = 'open';
      var explorationId = 'exp1';
      var threadId = 'thread_1';
      var explorationTitle = 'Exploration Title';
      var threadMessages = [{
        message_id: '1',
        text: 'Feedback 1',
        updated_status: 'open',
        suggestion_html: 'An instead of a',
        current_content_html: 'A orange',
        description: 'Suggestion for english grammar',
        author_username: 'username2',
        author_picture_data_url: 'foo',
        created_on_msecs: 1200
      }];

      expect(ctrl.numberOfUnreadThreads).toBe(10);

      $httpBackend.expect('GET', '/learnerdashboardthreadhandler/thread_1')
        .respond({
          message_summary_list: threadMessages
        });
      ctrl.onClickThread(
        threadStatus, explorationId, threadId, explorationTitle);
      $httpBackend.flush();
      expect(ctrl.feedbackThreadActive).toBe(true);

      var newActiveSectionName = 'I18N_LEARNER_DASHBOARD_FEEDBACK_SECTION';
      ctrl.setActiveSection(newActiveSectionName);

      expect(ctrl.activeSection).toBe(newActiveSectionName);
      expect(ctrl.feedbackThreadActive).toBe(false);

      var newActiveSectionName2 = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      ctrl.setActiveSection(newActiveSectionName2);

      expect(ctrl.activeSection).toBe(newActiveSectionName2);
      expect(ctrl.feedbackThreadActive).toBe(false);
    });

    it('should set active subsection successfully', function() {
      // Active subsection is set as I18N_DASHBOARD_EXPLORATIONS when controller
      // is initialized.
      expect(ctrl.activeSubsection).toBe('I18N_DASHBOARD_EXPLORATIONS');

      var newActiveSubsection = 'I18N_DASHBOARD_COLLECTIONS';
      ctrl.setActiveSubsection(newActiveSubsection);
      expect(ctrl.activeSubsection).toBe(newActiveSubsection);

      var newActiveSubsection2 = 'I18N_DASHBOARD_EXPLORATIONS';
      ctrl.setActiveSubsection(newActiveSubsection2);
      expect(ctrl.activeSubsection).toBe(newActiveSubsection2);
    });

    it('should get exploration url', function() {
      expect(ctrl.getExplorationUrl('1')).toBe('/explore/1');
      expect(ctrl.getExplorationUrl()).toBe('/explore/undefined');
    });

    it('should get collection url', function() {
      expect(ctrl.getCollectionUrl('1')).toBe('/collection/1');
      expect(ctrl.getCollectionUrl()).toBe('/collection/undefined');
    });

    it('should check if application is being used on a mobile', function() {
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
      var innerWidthSpy = spyOnProperty($window, 'innerWidth');
      innerWidthSpy.and.returnValue(400);
      expect(ctrl.checkMobileView()).toBe(true);

      innerWidthSpy.and.returnValue(700);
      expect(ctrl.checkMobileView()).toBe(false);
    });

    it('should show username popover based on its length', function() {
      expect(ctrl.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
      expect(ctrl.showUsernamePopover('abc')).toBe('none');
    });

    it('should go to through pages of incomplete explorations', function() {
      var section = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      var subsection = 'I18N_DASHBOARD_EXPLORATIONS';

      expect(ctrl.startIncompleteExpIndex).toBe(0);

      ctrl.goToNextPage(section, subsection);
      expect(ctrl.startIncompleteExpIndex).toBe(8);

      ctrl.goToPreviousPage(section, subsection);
      expect(ctrl.startIncompleteExpIndex).toBe(0);
    });

    it('should go to through pages of incomplete collections', function() {
      var section = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      var subsection = 'I18N_DASHBOARD_COLLECTIONS';

      expect(ctrl.startIncompleteCollectionIndex).toBe(0);

      ctrl.goToNextPage(section, subsection);
      expect(ctrl.startIncompleteCollectionIndex).toBe(8);

      ctrl.goToPreviousPage(section, subsection);
      expect(ctrl.startIncompleteCollectionIndex).toBe(0);
    });

    it('should go to through page of completed explorations', function() {
      var section = 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION';
      var subsection = 'I18N_DASHBOARD_EXPLORATIONS';

      var completedExplorations = learnerDashboardData
        .completed_explorations_list.map(
          expSummary => learnerExplorationSummaryObjectFactory
            .createFromBackendDict(expSummary));

      expect(ctrl.startCompletedExpIndex).toBe(0);
      expect(ctrl.getVisibleExplorationList(ctrl.startCompletedExpIndex))
        .toEqual(completedExplorations.slice(0, 8));

      ctrl.goToNextPage(section, subsection);
      expect(ctrl.startCompletedExpIndex).toBe(8);
      expect(ctrl.getVisibleExplorationList(ctrl.startCompletedExpIndex))
        .toEqual(completedExplorations.slice(8));

      ctrl.goToPreviousPage(section, subsection);
      expect(ctrl.startCompletedExpIndex).toBe(0);
      expect(ctrl.getVisibleExplorationList(ctrl.startCompletedExpIndex))
        .toEqual(completedExplorations.slice(0, 8));
    });

    it('should go to through page of completed collections', function() {
      var section = 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION';
      var subsection = 'I18N_DASHBOARD_COLLECTIONS';

      expect(ctrl.startCompletedCollectionIndex).toBe(0);

      ctrl.goToNextPage(section, subsection);
      expect(ctrl.startCompletedCollectionIndex).toBe(8);

      ctrl.goToPreviousPage(section, subsection);
      expect(ctrl.startCompletedCollectionIndex).toBe(0);
    });

    it('should set explorations sorting options', function() {
      expect(ctrl.isCurrentExpSortDescending).toBe(true);
      expect(ctrl.currentExpSortType).toBe('last_played');
      ctrl.setExplorationsSortingOptions('last_played');
      expect(ctrl.isCurrentExpSortDescending).toBe(false);

      ctrl.setExplorationsSortingOptions('title');
      expect(ctrl.currentExpSortType).toBe('title');
    });

    it('should set subscription sorting options', function() {
      expect(ctrl.isCurrentSubscriptionSortDescending).toBe(true);
      expect(ctrl.currentSubscribersSortType).toBe('username');
      ctrl.setSubscriptionSortingOptions('username');
      expect(ctrl.isCurrentSubscriptionSortDescending).toBe(false);

      ctrl.setSubscriptionSortingOptions('impact');
      expect(ctrl.currentSubscribersSortType).toBe('impact');
    });

    it('should set feedback sorting options', function() {
      expect(ctrl.isCurrentFeedbackSortDescending).toBe(true);
      expect(ctrl.currentFeedbackThreadsSortType).toBe('lastUpdatedMsecs');
      ctrl.setFeedbackSortingOptions('lastUpdatedMsecs');
      expect(ctrl.isCurrentFeedbackSortDescending).toBe(false);

      ctrl.setFeedbackSortingOptions('exploration');
      expect(ctrl.currentFeedbackThreadsSortType).toBe('exploration');
    });

    it('should get value of exploration sort key property', function() {
      // The default sort option is exploration last played.
      expect(ctrl.currentExpSortType).toBe('last_played');

      // The forEach loop is being used here because
      // getValueOfExplorationSortKey is used in a ng-repeat directive.
      ctrl.completedExplorationsList.forEach(function(exploration) {
        expect(ctrl.getValueOfExplorationSortKey(exploration)).toBe(null);
      });

      ctrl.setExplorationsSortingOptions('title');
      expect(ctrl.currentExpSortType).toBe('title');
      ctrl.completedExplorationsList.forEach(function(exploration, index) {
        expect(ctrl.getValueOfExplorationSortKey(exploration)).toBe(
          'Exploration Title ' + (index + 1));
      });
    });

    it('should get value of subscription sort key property', function() {
      // The default sort option is exploration last played.
      expect(ctrl.currentSubscribersSortType).toBe('username');

      // The forEach loop is being used here because
      // getValueOfSubscriptionSortKey is used in a ng-repeat directive.
      ctrl.subscriptionsList.forEach(function(subscription) {
        expect(ctrl.getValueOfSubscriptionSortKey(subscription)).toBe(
          'username1');
      });

      ctrl.setSubscriptionSortingOptions('impact');
      expect(ctrl.currentSubscribersSortType).toBe('impact');
      ctrl.subscriptionsList.forEach(function(subscription) {
        expect(ctrl.getValueOfSubscriptionSortKey(subscription)).toBe(0);
      });
    });

    it('should get messages from a thread', function() {
      var threadStatus = 'open';
      var explorationId = 'exp1';
      var threadId = 'thread_1';
      var explorationTitle = 'Exploration Title';
      var threadMessages = [{
        message_id: '1',
        text: 'Feedback 1',
        updated_status: 'open',
        suggestion_html: 'An instead of a',
        current_content_html: 'A orange',
        description: 'Suggestion for english grammar',
        author_username: 'username2',
        author_picture_data_url: 'foo',
        created_on_msecs: 1200
      }];

      expect(ctrl.numberOfUnreadThreads).toBe(10);

      $httpBackend.expect('GET', '/learnerdashboardthreadhandler/thread_1')
        .respond({
          message_summary_list: threadMessages
        });
      ctrl.onClickThread(
        threadStatus, explorationId, threadId, explorationTitle);

      expect(ctrl.loadingFeedbacks).toBe(true);
      expect(ctrl.feedbackThreadActive).toBe(true);
      expect(ctrl.numberOfUnreadThreads).toBe(9);
      $httpBackend.flush();

      expect(ctrl.messageSummaries.length).toBe(1);
    });

    it('should show all threads when a thread is clicked', function() {
      var threadStatus = 'open';
      var explorationId = 'exp1';
      var threadId = 'thread_1';
      var explorationTitle = 'Exploration Title';
      var threadMessages = [{
        message_id: '1',
        text: 'Feedback 1',
        updated_status: 'open',
        suggestion_html: 'An instead of a',
        current_content_html: 'A orange',
        description: 'Suggestion for english grammar',
        author_username: 'username2',
        author_picture_data_url: 'foo',
        created_on_msecs: 1200
      }];

      expect(ctrl.numberOfUnreadThreads).toBe(10);

      $httpBackend.expect('GET', '/learnerdashboardthreadhandler/thread_1')
        .respond({
          message_summary_list: threadMessages
        });
      ctrl.onClickThread(
        threadStatus, explorationId, threadId, explorationTitle);
      $httpBackend.flush();
      expect(ctrl.feedbackThreadActive).toBe(true);

      ctrl.showAllThreads();
      expect(ctrl.feedbackThreadActive).toBe(false);
    });

    it('should successfully add a new message in a thread', function() {
      var threadStatus = 'open';
      var explorationId = 'exp1';
      var threadId = 'thread_1';
      var explorationTitle = 'Exploration Title';
      var threadMessages = [{
        message_id: '1',
        text: 'Feedback 1',
        updated_status: 'open',
        suggestion_html: 'An instead of a',
        current_content_html: 'A orange',
        description: 'Suggestion for english grammar',
        author_username: 'username2',
        author_picture_data_url: 'foo',
        created_on_msecs: 1200
      }];

      $httpBackend.expect('GET', '/learnerdashboardthreadhandler/thread_1')
        .respond({
          message_summary_list: threadMessages
        });
      ctrl.onClickThread(
        threadStatus, explorationId, threadId, explorationTitle);
      $httpBackend.flush();

      var threadId = 'thread_1';
      var message = 'This is a new message';
      $httpBackend.expect('POST', '/threadhandler/' + threadId).respond(200);
      ctrl.addNewMessage(threadId, message);

      expect(ctrl.messageSendingInProgress).toBe(true);

      $httpBackend.flush();
      expect(ctrl.messageSendingInProgress).toBe(false);
    });

    it('should show suggestion modal', function() {
      spyOn(SuggestionModalForLearnerDashboardService, 'showSuggestionModal')
        .and.callThrough();
      var newContent = 'New content';
      var oldContent = 'Old content';
      var description = 'Description';
      ctrl.showSuggestionModal(newContent, oldContent, description);

      expect(SuggestionModalForLearnerDashboardService.showSuggestionModal)
        .toHaveBeenCalledWith('edit_exploration_state_content', {
          newContent: newContent,
          oldContent: oldContent,
          description: description
        });
    });

    it('should open uib modal when removing activity', function() {
      spyOn($uibModal, 'open').and.callThrough();

      var sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      var subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
      var activity = {};
      ctrl.openRemoveActivityModal(sectionNameI18nId, subsectionName, activity);

      expect($uibModal.open).toHaveBeenCalled();
    });

    it('should remove an incomplete exploration activity', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      expect(ctrl.incompleteExplorationsList.length).toBe(12);

      var sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      var subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
      // Get exploration with id 13.
      var activity = learnerExplorationSummaryObjectFactory
        .createFromBackendDict(
          learnerDashboardData.incomplete_explorations_list[2]);
      ctrl.openRemoveActivityModal(sectionNameI18nId, subsectionName, activity);
      $scope.$apply();

      expect(ctrl.incompleteExplorationsList.length).toBe(11);
    });

    it('should not remove an activity if its not present', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      expect(ctrl.incompleteExplorationsList.length).toBe(12);

      var sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      var subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
      // Get exploration with id 13.
      var activity = learnerExplorationSummaryObjectFactory
        .createFromBackendDict({
          id: 100
        });
      ctrl.openRemoveActivityModal(sectionNameI18nId, subsectionName, activity);
      $scope.$apply();

      expect(ctrl.incompleteExplorationsList.length).toBe(12);
    });

    it('should remove an incomplete collection activity', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      expect(ctrl.incompleteCollectionsList.length).toBe(8);

      var sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      var subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
      // Get collection with id 11.

      var activity = collectionSummaryObjectFactory.createFromBackendDict(
        learnerDashboardData.incomplete_collections_list[2]);

      ctrl.openRemoveActivityModal(sectionNameI18nId, subsectionName, activity);
      $scope.$apply();

      expect(ctrl.incompleteCollectionsList.length).toBe(7);
    });

    it('should remove an activity from exploration playlist', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      expect(ctrl.explorationPlaylist.length).toBe(10);

      var sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      var subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';

      // Exploration with id 2.
      var activity = learnerExplorationSummaryObjectFactory
        .createFromBackendDict(
          learnerDashboardData.exploration_playlist[1]);

      ctrl.openRemoveActivityModal(sectionNameI18nId, subsectionName, activity);
      $scope.$apply();

      expect(ctrl.explorationPlaylist.length).toBe(9);
    });

    it('should remove an activity from collection playlist', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      expect(ctrl.collectionPlaylist.length).toBe(8);

      var sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      var subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
      // Get collection with id 2.
      var activity = collectionSummaryObjectFactory.createFromBackendDict(
        learnerDashboardData.collection_playlist[1]);

      ctrl.openRemoveActivityModal(sectionNameI18nId, subsectionName, activity);
      $scope.$apply();

      expect(ctrl.collectionPlaylist.length).toBe(7);
    });

    it('should get css classes based on status', function() {
      expect(ctrl.getLabelClass('open')).toBe('badge badge-info');
      expect(ctrl.getLabelClass('compliment')).toBe('badge badge-success');
      expect(ctrl.getLabelClass('another')).toBe('badge badge-secondary');
    });

    it('should get human readable status from provided status', function() {
      expect(ctrl.getHumanReadableStatus('open')).toBe('Open');
      expect(ctrl.getHumanReadableStatus('compliment')).toBe('Compliment');
      expect(ctrl.getHumanReadableStatus('not_actionable')).toBe(
        'Not Actionable');
    });

    it('should get locate date string', function() {
      // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
      var NOW_MILLIS = 1416563100000;
      spyOn(DateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
        .withArgs(NOW_MILLIS).and.returnValue('11/21/2014');
      expect(ctrl.getLocaleAbbreviatedDatetimeString(NOW_MILLIS)).toBe(
        '11/21/2014');
    });
  });

  describe('when fetching dashboard data fails', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      AlertsService = $injector.get('AlertsService');
      CsrfTokenService = $injector.get('CsrfTokenService');
      LearnerDashboardBackendApiService = $injector.get(
        'LearnerDashboardBackendApiService');
      UserService = $injector.get('UserService');

      spyOn(CsrfTokenService, 'getTokenAsync').and.returnValue(
        $q.resolve('sample-csrf-token'));

      spyOn(UserService, 'getProfileImageDataUrlAsync').and.returnValue(
        $q.resolve(profilePictureDataUrl));
      spyOn(UserService, 'getUserInfoAsync').and.returnValue($q.resolve(
        userInfo));
      spyOn(LearnerDashboardBackendApiService, 'fetchLearnerDashboardData')
        .and.returnValue($q.reject({
          status: 404
        }));

      $scope = $rootScope.$new();
      ctrl = $componentController('learnerDashboardPage', {
        $rootScope: $scope
      });
      ctrl.$onInit();
    }));

    it('should show an alert warning', function() {
      spyOn(AlertsService, 'addWarning').and.callThrough();
      $scope.$apply();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get learner dashboard data');
    });
  });

  describe('when triggering animation', function() {
    var $$animateJs = null;

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $$animateJs = $injector.get('$$animateJs');
      $rootScope = $injector.get('$rootScope');

      $scope = $rootScope.$new();
      ctrl = $componentController('learnerDashboardPage', {
        $rootScope: $scope
      });
    }));

    it('should animate when adding and removing css classes', function() {
      var element = angular.element(
        '<div class="menu-sub-section"></div>');
      var elementSlideUpSpy = spyOn(element, 'slideUp').and.callThrough();
      var elementSlideDownSpy = spyOn(element, 'slideDown').and.callThrough();

      // $$animateJs is a lower-level service which is used to simulate
      // animation behavior.
      // eslint-disable-next-line max-len
      // Ref: https://stackoverflow.com/questions/33405666/nganimate-1-4-7-unit-test-not-calling-animation-functions
      $$animateJs(element, 'addClass', {
        addClass: 'ng-hide'
      }).start();
      expect(elementSlideUpSpy).toHaveBeenCalled();

      $$animateJs(element, 'removeClass', {
        removeClass: 'ng-hide'
      }).start();
      expect(elementSlideDownSpy).toHaveBeenCalled();
    });
  });
});
