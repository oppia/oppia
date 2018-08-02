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

oppia.constant('')

oppia.controller('CreatorDashboard', [
  '$scope', '$rootScope', '$http', '$window', '$uibModal',
  'DateTimeFormatService', 'AlertsService', 'CreatorDashboardBackendApiService',
  'RatingComputationService', 'ExplorationCreationService',
  'SuggestionObjectFactory', 'SuggestionThreadObjectFactory',
  'UrlInterpolationService', 'FATAL_ERROR_CODES',
  'EXPLORATION_DROPDOWN_STATS', 'EXPLORATIONS_SORT_BY_KEYS',
  'HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS', 'SUBSCRIPTION_SORT_BY_KEYS',
  'HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS',
  function(
      $scope, $rootScope, $http, $window, $uibModal, DateTimeFormatService,
      AlertsService, CreatorDashboardBackendApiService,
      RatingComputationService, ExplorationCreationService,
      SuggestionObjectFactory,  SuggestionThreadObjectFactory,
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

    var _fetchMessages = function(threadId) {
      $http.get('/threadhandler/' + threadId).then(function(response) {
        var allThreads = $scope.mySuggestionsList.concat(
          $scope.suggestionsToReviewList);
        for (var i = 0; i < allThreads.length; i++) {
          if (allThreads[i].threadId === threadId) {
            allThreads[i].setMessages(response.data.messages);
            break;
          }
        }
      });
    };

    $scope.clearActiveThread = function() {
      $scope.activeThread = null;
    };

    $scope.setActiveThread = function(threadId) {
      _fetchMessages(threadId);
      var allThreads = [].concat(
        $scope.mySuggestionsList, $scope.suggestionsToReviewList);
      for (var i = 0; i < allThreads.length; i++) {
        if (allThreads[i].threadId === threadId) {
          $scope.activeThread = allThreads[i];
          break;
        }
      }
      console.log($scope.activeThread)
    };

    $scope.showSuggestionModal = function() {
      if ($scope.activeThread.suggestion.suggestionType ===
          'edit_exploration_state_content') {
        templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/creator_dashboard/' +
          'view_suggestion_edit_exploration_state_content_modal.html');
      }

      $uibModal.open({
        templateUrl: templateUrl,
        backdrop: true,
        size: 'lg',
        resolve: {
          suggestionIsHandled: function() {
            return $scope.activeThread.isSuggestionHandled();;
          },
          suggestionIsValid: function() {
            /*if ($scope.activeThread.suggestion.suggestionType ===
                'edit_exploration_state_content') {
              return ExplorationStatesService.hasState(
                $scope.activeThread.getSuggestionStateName());
            }*/
            return true;
          },
          suggestionStatus: function() {
            return $scope.activeThread.getSuggestionStatus();
          },
          description: function() {
            return $scope.activeThread.description;
          },
          oldContent: function() {
            return $scope.activeThread.suggestion.oldValue;
          },
          newContent: function() {
            return $scope.activeThread.suggestion.newValue;
          }
        },
        controller: [
          '$scope', '$log', '$uibModalInstance', 'suggestionIsHandled',
          'suggestionIsValid', 'suggestionStatus', 'description', 'oldContent',
          'newContent', function(
              $scope, $log, $uibModalInstance, suggestionIsHandled,
              suggestionIsValid, suggestionStatus, description, oldContent,
              newContent) {
            var SUGGESTION_ACCEPTED_MSG = 'This suggestion has already been ' +
              'accepted.';
            var SUGGESTION_REJECTED_MSG = 'This suggestion has already been ' +
              'rejected.';
            var SUGGESTION_INVALID_MSG = 'This suggestion is not valid' +
              ' anymore. It cannot be accepted.';
            var ACTION_ACCEPT_SUGGESTION = 'accept'
            var ACTION_REJECT_SUGGESTION = 'reject'
            $scope.isNotHandled = !suggestionIsHandled;
            $scope.canReject = $scope.isNotHandled;
            $scope.canAccept = $scope.isNotHandled && suggestionIsValid;

            if (!$scope.isNotHandled) {
              $scope.errorMessage = (suggestionStatus === 'accepted') ?
                SUGGESTION_ACCEPTED_MSG : SUGGESTION_REJECTED_MSG;
            } else if (!suggestionIsValid) {
              $scope.errorMessage = SUGGESTION_INVALID_MSG;
            } else {
              $scope.errorMessage = '';
            }

            $scope.oldContent = oldContent;
            $scope.newContent = newContent;
            $scope.commitMessage = description;
            $scope.reviewMessage = null;
            console.log(newContent)
            $scope.acceptSuggestion = function() {
              $uibModalInstance.close({
                action: ACTION_ACCEPT_SUGGESTION,
                commitMessage: $scope.commitMessage,
                reviewMessage: $scope.reviewMessage,
              });
            };

            $scope.rejectSuggestion = function() {
              $uibModalInstance.close({
                action: ACTION_REJECT_SUGGESTION,
                reviewMessage: $scope.reviewMessage
              });
            };

            $scope.cancelReview = function() {
              $uibModalInstance.dismiss();
            };
          }
        ]
      }).result.then(function(result) {
        console.log($scope.activeThread)
        $http.put(
            '/generalsuggestionactionhandler/' + 'exploration/' +
            $scope.activeThread.suggestion.targetId + '/' +
            $scope.activeThread.suggestion.suggestionId, {
              action: result.action,
              commitMessage: result.commitMessage,
              reviewMessage: result.reviewMessage
            }).then(null,  function() {
              $log.error('Error resolving suggestion');
            });
      });
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

    $scope.getCompleteThumbnailIconUrl = function (iconUrl) {
      return UrlInterpolationService.getStaticImageUrl(iconUrl);
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
        var number_of_created_suggestions = (
          responseData.threads_for_created_suggestions_list.length);
        var numebr_of_suggestions_to_review = (
          responseData.threads_for_suggestions_to_review_list.length);
        $scope.mySuggestionsList = [];
        for (var i = 0; i < number_of_created_suggestions; i++) {
          if (responseData.created_suggestions_list.length !==
              number_of_created_suggestions) {
            $log.error('Number of suggestions does not match number of ' +
                       'suggestion threads');
          }
          for (var j = 0; j < number_of_created_suggestions; j++) {
             var suggestion = SuggestionObjectFactory.createFromBackendDict(
              responseData.created_suggestions_list[j]);
             var threadDict = (
              responseData.threads_for_created_suggestions_list[i]);
             if (threadDict['thread_id'] === suggestion.threadId()) {
              var suggestionThread = (
                SuggestionThreadObjectFactory.createFromBackendDicts(
                  threadDict, responseData.created_suggestions_list[j]));
              $scope.mySuggestionsList.push(suggestionThread);
             }
          }
        }
        $scope.suggestionsToReviewList = [];
        for (var i = 0; i < numebr_of_suggestions_to_review; i++) {
          if (responseData.created_suggestions_list.length !==
              numebr_of_suggestions_to_review) {
            $log.error('Number of suggestions does not match number of ' +
                       'suggestion threads');
          }
          for (var j = 0; j < numebr_of_suggestions_to_review; j++) {
             var suggestion = SuggestionObjectFactory.createFromBackendDict(
              responseData.created_suggestions_list[j]);
             var threadDict = (
              responseData.threads_for_created_suggestions_list[i]);
             if (threadDict['thread_id'] === suggestion.threadId()) {
              var suggestionThread = (
                SuggestionThreadObjectFactory.createFromBackendDicts(
                  threadDict, responseData.created_suggestions_list[j]));
              $scope.suggestionsToReviewList.push(suggestionThread);
             }
          }
        }

        if ($scope.dashboardStats && $scope.lastWeekStats) {
          $scope.relativeChangeInTotalPlays = (
            $scope.dashboardStats.total_plays - $scope.lastWeekStats.total_plays
          );
        }
        if ($scope.explorationsList.length === 0 &&
          $scope.collectionsList.length > 0) {
          $scope.activeTab = 'myCollections';
        } else if ($scope.explorationsList.length === 0 && (
          $scope.mySuggestionsList.length > 0 ||
          $scope.suggestionsToReviewList.length > 0)) {
          $scope.activeTab = 'suggestions'
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
