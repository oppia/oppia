// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controllers for the creator dashboard.
 */

oppia.constant('EXPLORATION_DROPDOWN_STATS', {
  OPEN_FEEDBACK: 'open_feedback'
});

oppia.constant('EXPLORATIONS_SORT_BY_KEYS', {
  TITLE: 'title',
  RATING: 'ratings',
  NUM_VIEWS: 'num_views',
  OPEN_FEEDBACK: 'num_open_threads',
  LAST_UPDATED: 'last_updated_msec'
});

oppia.constant('HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS', {
  TITLE: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_TITLE ',
  RATING: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_AVERAGE_RATING',
  NUM_VIEWS: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_TOTAL_PLAYS',
  OPEN_FEEDBACK: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_OPEN_FEEDBACK',
  LAST_UPDATED: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_UPDATED'
});

oppia.constant('SUBSCRIPTION_SORT_BY_KEYS', {
  USERNAME: 'subscriber_username',
  IMPACT: 'subscriber_impact'
});

oppia.constant('HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS', {
  USERNAME: 'Username',
  IMPACT: 'Impact'
});

oppia.controller('CreatorDashboard', [
  '$scope', '$rootScope', '$http', '$uibModal', '$window',
  'DateTimeFormatService', 'AlertsService', 'CreatorDashboardBackendApiService',
  'RatingComputationService', 'ExplorationCreationService',
  'QuestionObjectFactory','TopicsAndSkillsDashboardBackendApiService',
  'UrlInterpolationService', 'FATAL_ERROR_CODES',
  'EXPLORATION_DROPDOWN_STATS', 'EXPLORATIONS_SORT_BY_KEYS',
  'HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS', 'SUBSCRIPTION_SORT_BY_KEYS',
  'HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS',
  function(
      $scope, $rootScope, $http, $uibModal, $window, DateTimeFormatService,
      AlertsService, CreatorDashboardBackendApiService,
      RatingComputationService, ExplorationCreationService,
      QuestionObjectFactory, TopicsAndSkillsDashboardBackendApiService,
      UrlInterpolationService, FATAL_ERROR_CODES,
      EXPLORATION_DROPDOWN_STATS, EXPLORATIONS_SORT_BY_KEYS,
      HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS, SUBSCRIPTION_SORT_BY_KEYS,
      HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS) {
    var EXP_PUBLISH_TEXTS = {
      defaultText: (
        'This exploration is private. Publish it to receive statistics.'),
      smText: 'Publish the exploration to receive statistics.'
    };

    $scope.DEFAULT_EMPTY_TITLE = 'Untitled';
    $scope.EXPLORATION_DROPDOWN_STATS = EXPLORATION_DROPDOWN_STATS;
    $scope.EXPLORATIONS_SORT_BY_KEYS = EXPLORATIONS_SORT_BY_KEYS;
    $scope.HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS = (
      HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS);
    $scope.SUBSCRIPTION_SORT_BY_KEYS = SUBSCRIPTION_SORT_BY_KEYS;
    $scope.HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS = (
      HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS);
    $scope.DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD = (
      GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD);

    $scope.canCreateCollections = GLOBALS.can_create_collections;
    $scope.getAverageRating = RatingComputationService.computeAverageRating;
    $scope.createNewExploration = (
      ExplorationCreationService.createNewExploration);
    $scope.getLocaleAbbreviatedDatetimeString = (
      DateTimeFormatService.getLocaleAbbreviatedDatetimeString);

    $scope.emptyDashboardImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/general/empty_dashboard.svg');

    $scope.setActiveTab = function(newActiveTabName) {
      $scope.activeTab = newActiveTabName;
    };

    $scope.getExplorationUrl = function(explorationId) {
      return '/create/' + explorationId;
    };

    $scope.getCollectionUrl = function(collectionId) {
      return '/collection_editor/create/' + collectionId;
    };

    $scope.setMyExplorationsView = function(viewType) {
      $http.post('/creatordashboardhandler/data', {
        display_preference: viewType,
      }).then(function() {
        $scope.myExplorationsView = viewType;
      });
    };

    $scope.checkMobileView = function() {
      return ($window.innerWidth < 500);
    };

    $scope.showUsernamePopover = function(subscriberUsername) {
      // The popover on the subscription card is only shown if the length of
      // the subscriber username is greater than 10 and the user hovers over
      // the truncated username.
      if (subscriberUsername.length > 10) {
        return 'mouseenter';
      } else {
        return 'none';
      }
    };

    $scope.updatesGivenScreenWidth = function() {
      if ($scope.checkMobileView()) {
        $scope.myExplorationsView = (
          constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.CARD);
        $scope.publishText = EXP_PUBLISH_TEXTS.smText;
      } else {
        $scope.publishText = EXP_PUBLISH_TEXTS.defaultText;
      }
    };

    $scope.updatesGivenScreenWidth();
    angular.element($window).bind('resize', function() {
      $scope.updatesGivenScreenWidth();
    });

    $scope.setExplorationsSortingOptions = function(sortType) {
      if (sortType === $scope.currentSortType) {
        $scope.isCurrentSortDescending = !$scope.isCurrentSortDescending;
      } else {
        $scope.currentSortType = sortType;
      }
    };

    $scope.setSubscriptionSortingOptions = function(sortType) {
      if (sortType === $scope.currentSubscribersSortType) {
        $scope.isCurrentSubscriptionSortDescending = (
          !$scope.isCurrentSubscriptionSortDescending);
      } else {
        $scope.currentSubscribersSortType = sortType;
      }
    };

    $scope.sortSubscriptionFunction = function(entity) {
      // This function is passed as a custom comparator function to `orderBy`,
      // so that special cases can be handled while sorting subscriptions.
      var value = entity[$scope.currentSubscribersSortType];
      if ($scope.currentSubscribersSortType ===
          SUBSCRIPTION_SORT_BY_KEYS.IMPACT) {
        value = (value || 0);
      }
      return value;
    };

    $scope.sortByFunction = function(entity) {
      // This function is passed as a custom comparator function to `orderBy`,
      // so that special cases can be handled while sorting explorations.
      var value = entity[$scope.currentSortType];
      if (entity.status === 'private') {
        if ($scope.currentSortType === EXPLORATIONS_SORT_BY_KEYS.TITLE) {
          value = (value || $scope.DEFAULT_EMPTY_TITLE);
        } else if ($scope.currentSortType !==
                   EXPLORATIONS_SORT_BY_KEYS.LAST_UPDATED) {
          value = 0;
        }
      } else if ($scope.currentSortType === EXPLORATIONS_SORT_BY_KEYS.RATING) {
        var averageRating = $scope.getAverageRating(value);
        value = (averageRating || 0);
      }
      return value;
    };

    $scope.getCompleteThumbnailIconUrl = function(iconUrl) {
      return UrlInterpolationService.getStaticImageUrl(iconUrl);
    };

    $scope.showCreateQuestionModal = function() {
      var question = QuestionObjectFactory.createDefaultQuestion();
      TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
        function(response) {
          var topicSummaries = response.data.topic_summary_dicts;
          console.log($scope.topicSummaries)
          $uibModal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/creator_dashboard/create_question_modal.html'),
            backdrop: true,
            size: 'lg',
            resolve: {},
            controller: [
              '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                $scope.question = question;
                $scope.topicId = null;
                $scope.questionStateData = $scope.question.getStateData();
                $scope.topicSummaries = topicSummaries;

                $scope.isNotValidQuestion = function() {
                  return !$scope.question.validate()
                };

                $scope.dismissModal = function() {
                  $uibModalInstance.dismiss();
                };

                $scope.createQuestion = function() {
                  $uibModalInstance.close({
                    question: question,
                    topicId: $scope.topicId
                  });
                };
              }
            ]
          }).result.then(function(result) {
            var topicVersion = null;
            for (var i = 0; i < topicSummaries.length; i++) {
              if (topicSummaries[i].id === result.topicId) {
                topicVersion = topicSummaries[i].version;
                break;
              }
            }
            console.log(topicVersion)
            console.log()
            $http.post('/generalsuggestionhandler/', {
              suggestion_type: 'add_question',
              target_type: 'topic',
              target_id: result.topicId,
              target_version_at_submission: topicVersion,
              change: {
                cmd: 'create_new_fully_specified_question',
                question_dict: result.question.toBackendDict(true),
                skill_id: null
              },
              description: 'question title'
            });
          }, function() {
            $log('Error while submitting question')
          });
        });
    };

    $rootScope.loadingMessage = 'Loading';
    CreatorDashboardBackendApiService.fetchDashboardData().then(
      function(response) {
        var responseData = response.data;
        $scope.currentSortType = EXPLORATIONS_SORT_BY_KEYS.OPEN_FEEDBACK;
        $scope.currentSubscribersSortType = SUBSCRIPTION_SORT_BY_KEYS.USERNAME;
        $scope.isCurrentSortDescending = true;
        $scope.isCurrentSubscriptionSortDescending = true;
        $scope.explorationsList = responseData.explorations_list;
        $scope.collectionsList = responseData.collections_list;
        $scope.subscribersList = responseData.subscribers_list;
        $scope.dashboardStats = responseData.dashboard_stats;
        $scope.lastWeekStats = responseData.last_week_stats;
        $scope.myExplorationsView = responseData.display_preference;
        if ($scope.dashboardStats && $scope.lastWeekStats) {
          $scope.relativeChangeInTotalPlays = (
            $scope.dashboardStats.total_plays - $scope.lastWeekStats.total_plays
          );
        }
        if ($scope.explorationsList.length === 0 &&
          $scope.collectionsList.length > 0) {
          $scope.activeTab = 'myCollections';
        } else {
          $scope.activeTab = 'myExplorations';
        }
        $rootScope.loadingMessage = '';
      },
      function(errorResponse) {
        if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
          AlertsService.addWarning('Failed to get dashboard data');
        }
      }
    );
  }
]);
