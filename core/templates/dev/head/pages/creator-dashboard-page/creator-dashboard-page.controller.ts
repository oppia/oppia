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
 * @fileoverview Directive for the creator dashboard.
 */

// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
require('directives/AngularHtmlBindDirective.ts');
require('filters/string-utility-filters/camel-case-to-hyphens.filter.ts');
require('filters/string-utility-filters/capitalize.filter.ts');
require('filters/string-utility-filters/convert-to-plain-text.filter.ts');
require('filters/format-rte-preview.filter.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require(
  'filters/string-utility-filters/' +
  'normalize-whitespace-punctuation-and-case.filter.ts');
require('filters/parameterize-rule-description.filter.ts');
require('filters/remove-duplicates-in-array.filter.ts');
require(
  'filters/string-utility-filters/replace-inputs-with-ellipses.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('filters/string-utility-filters/truncate-and-capitalize.filter.ts');
require('filters/string-utility-filters/truncate-at-first-ellipsis.filter.ts');
require('filters/string-utility-filters/truncate-at-first-line.filter.ts');
require('filters/truncate-input-based-on-interaction-answer-type.filter.ts');
require('filters/string-utility-filters/underscores-to-camel-case.filter.ts');
require('filters/string-utility-filters/wrap-text-with-ellipsis.filter.ts');
require('components/ratings/rating-computation/rating-computation.service.ts');
require('filters/convert-unicode-with-params-to-html.filter.ts');
require('filters/convert-html-to-unicode.filter.ts');
require('filters/convert-unicode-to-html.filter.ts');
require('components/forms/validators/is-at-least.filter.ts');
require('components/forms/validators/is-at-most.filter.ts');
require('components/forms/validators/is-float.filter.ts');
require('components/forms/validators/is-integer.filter.ts');
require('components/forms/validators/is-nonempty.filter.ts');
require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require(
  'components/forms/custom-forms-directives/require-is-float.directive.ts');
// ^^^ this block of requires should be removed ^^^

require(
  'components/common-layout-directives/common-elements/' +
  'sharing-links.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require('components/summary-tile/collection-summary-tile.directive.ts');
require(
  'pages/exploration-editor-page/feedback-tab/thread-table/' +
  'thread-table.directive.ts');

require('interactions/interactionsRequires.ts');
require('objects/objectComponentsRequires.ts');

require('components/entity-creation-services/exploration-creation.service.ts');
require('components/ratings/rating-computation/rating-computation.service.ts');
require('domain/creator_dashboard/CreatorDashboardBackendApiService.ts');
require('domain/suggestion/SuggestionObjectFactory.ts');
require('domain/suggestion/SuggestionThreadObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require(
  'pages/creator-dashboard-page/suggestion-modal-for-creator-view/' +
  'suggestion-modal-for-creator-view.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-status-display.service.ts');
require('services/AlertsService.ts');
require('services/DateTimeFormatService.ts');
require('services/UserService.ts');

require('pages/creator-dashboard-page/creator-dashboard-page.constants.ts');

oppia.directive('creatorDashboardPage', ['UrlInterpolationService', function(
    UrlInterpolationService) {
  return {
    restrict: 'E',
    scope: {},
    bindToController: {},
    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
      '/pages/creator-dashboard-page/creator-dashboard-page.directive.html'),
    controllerAs: '$ctrl',
    controller: [
      '$http', '$log', '$q', '$rootScope', '$window',
      'AlertsService', 'CreatorDashboardBackendApiService',
      'DateTimeFormatService',
      'ExplorationCreationService', 'RatingComputationService',
      'SuggestionModalForCreatorDashboardService', 'SuggestionObjectFactory',
      'SuggestionThreadObjectFactory', 'ThreadStatusDisplayService',
      'UrlInterpolationService', 'UserService', 'EXPLORATIONS_SORT_BY_KEYS',
      'EXPLORATION_DROPDOWN_STATS', 'FATAL_ERROR_CODES',
      'HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS',
      'HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS',
      'SUBSCRIPTION_SORT_BY_KEYS',
      function(
          $http, $log, $q, $rootScope, $window,
          AlertsService, CreatorDashboardBackendApiService,
          DateTimeFormatService,
          ExplorationCreationService, RatingComputationService,
          SuggestionModalForCreatorDashboardService, SuggestionObjectFactory,
          SuggestionThreadObjectFactory, ThreadStatusDisplayService,
          UrlInterpolationService, UserService, EXPLORATIONS_SORT_BY_KEYS,
          EXPLORATION_DROPDOWN_STATS, FATAL_ERROR_CODES,
          HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS,
          HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS,
          SUBSCRIPTION_SORT_BY_KEYS) {
        var ctrl = this;
        var EXP_PUBLISH_TEXTS = {
          defaultText: (
            'This exploration is private. Publish it to receive statistics.'),
          smText: 'Publish the exploration to receive statistics.'
        };

        var userDashboardDisplayPreference =
          constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.CARD;

        ctrl.DEFAULT_EMPTY_TITLE = 'Untitled';
        ctrl.EXPLORATION_DROPDOWN_STATS = EXPLORATION_DROPDOWN_STATS;
        ctrl.EXPLORATIONS_SORT_BY_KEYS = EXPLORATIONS_SORT_BY_KEYS;
        ctrl.HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS = (
          HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS);
        ctrl.SUBSCRIPTION_SORT_BY_KEYS = SUBSCRIPTION_SORT_BY_KEYS;
        ctrl.HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS = (
          HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS);
        ctrl.DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD = (
          GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD);

        ctrl.canCreateCollections = null;
        $rootScope.loadingMessage = 'Loading';
        var userInfoPromise = UserService.getUserInfoAsync();
        userInfoPromise.then(function(userInfo) {
          ctrl.canCreateCollections = userInfo.canCreateCollections();
        });

        var dashboardDataPromise = (
          CreatorDashboardBackendApiService.fetchDashboardData());
        dashboardDataPromise.then(
          function(response) {
            var responseData = response.data;
            ctrl.currentSortType = EXPLORATIONS_SORT_BY_KEYS.OPEN_FEEDBACK;
            ctrl.currentSubscribersSortType =
              SUBSCRIPTION_SORT_BY_KEYS.USERNAME;
            ctrl.isCurrentSortDescending = true;
            ctrl.isCurrentSubscriptionSortDescending = true;
            ctrl.explorationsList = responseData.explorations_list;
            ctrl.collectionsList = responseData.collections_list;
            ctrl.subscribersList = responseData.subscribers_list;
            ctrl.dashboardStats = responseData.dashboard_stats;
            ctrl.lastWeekStats = responseData.last_week_stats;
            ctrl.myExplorationsView = responseData.display_preference;
            var numberOfCreatedSuggestions = (
              responseData.threads_for_created_suggestions_list.length);
            var numberOfSuggestionsToReview = (
              responseData.threads_for_suggestions_to_review_list.length);
            ctrl.mySuggestionsList = [];
            for (var i = 0; i < numberOfCreatedSuggestions; i++) {
              if (responseData.created_suggestions_list.length !==
                  numberOfCreatedSuggestions) {
                $log.error('Number of suggestions does not match number of ' +
                          'suggestion threads');
              }
              for (var j = 0; j < numberOfCreatedSuggestions; j++) {
                var suggestion = SuggestionObjectFactory
                  .createFromBackendDict(
                    responseData.created_suggestions_list[j]);
                var threadDict = (
                  responseData.threads_for_created_suggestions_list[i]);
                if (threadDict.thread_id === suggestion.getThreadId()) {
                  var suggestionThread = (
                    SuggestionThreadObjectFactory.createFromBackendDicts(
                      threadDict, responseData.created_suggestions_list[j]));
                  ctrl.mySuggestionsList.push(suggestionThread);
                }
              }
            }
            ctrl.suggestionsToReviewList = [];
            for (var i = 0; i < numberOfSuggestionsToReview; i++) {
              if (responseData.suggestions_to_review_list.length !==
                  numberOfSuggestionsToReview) {
                $log.error('Number of suggestions does not match number of ' +
                          'suggestion threads');
              }
              for (var j = 0; j < numberOfSuggestionsToReview; j++) {
                var suggestion = SuggestionObjectFactory
                  .createFromBackendDict(
                    responseData.suggestions_to_review_list[j]);
                var threadDict = (
                  responseData.threads_for_suggestions_to_review_list[i]);
                if (threadDict.thread_id === suggestion.getThreadId()) {
                  var suggestionThread = (
                    SuggestionThreadObjectFactory.createFromBackendDicts(
                      threadDict,
                      responseData.suggestions_to_review_list[j]));
                  ctrl.suggestionsToReviewList.push(suggestionThread);
                }
              }
            }

            if (ctrl.dashboardStats && ctrl.lastWeekStats) {
              ctrl.relativeChangeInTotalPlays = (
                ctrl.dashboardStats.total_plays - (
                  ctrl.lastWeekStats.total_plays)
              );
            }

            if (ctrl.explorationsList.length === 0 &&
              ctrl.collectionsList.length > 0) {
              ctrl.activeTab = 'myCollections';
            } else if (ctrl.explorationsList.length === 0 && (
              ctrl.mySuggestionsList.length > 0 ||
              ctrl.suggestionsToReviewList.length > 0)) {
              ctrl.activeTab = 'suggestions';
            } else {
              ctrl.activeTab = 'myExplorations';
            }
          },
          function(errorResponse) {
            if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
              AlertsService.addWarning('Failed to get dashboard data');
            }
          }
        );

        $q.all([userInfoPromise, dashboardDataPromise]).then(function() {
          $rootScope.loadingMessage = '';
        });

        ctrl.getAverageRating = RatingComputationService
          .computeAverageRating;
        ctrl.createNewExploration = (
          ExplorationCreationService.createNewExploration);
        ctrl.getLocaleAbbreviatedDatetimeString = (
          DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
        ctrl.getHumanReadableStatus = (
          ThreadStatusDisplayService.getHumanReadableStatus);

        ctrl.emptyDashboardImgUrl = UrlInterpolationService
          .getStaticImageUrl('/general/empty_dashboard.svg');
        ctrl.canReviewActiveThread = null;

        ctrl.setActiveTab = function(newActiveTabName) {
          ctrl.activeTab = newActiveTabName;
        };

        ctrl.getExplorationUrl = function(explorationId) {
          return '/create/' + explorationId;
        };

        ctrl.getCollectionUrl = function(collectionId) {
          return '/collection_editor/create/' + collectionId;
        };

        ctrl.setMyExplorationsView = function(newViewType) {
          $http.post('/creatordashboardhandler/data', {
            display_preference: newViewType,
          }).then(function() {
            ctrl.myExplorationsView = newViewType;
          });
          userDashboardDisplayPreference = newViewType;
        };

        ctrl.checkMobileView = function() {
          return ($window.innerWidth < 500);
        };

        ctrl.showUsernamePopover = function(subscriberUsername) {
          // The popover on the subscription card is only shown if the length
          // of the subscriber username is greater than 10 and the user hovers
          // over the truncated username.
          if (subscriberUsername.length > 10) {
            return 'mouseenter';
          } else {
            return 'none';
          }
        };

        ctrl.updatesGivenScreenWidth = function() {
          if (ctrl.checkMobileView()) {
            // For mobile users, the view of the creators
            // exploration list is shown only in
            // the card view and can't be switched to list view.
            ctrl.myExplorationsView = (
              constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.CARD);
            ctrl.publishText = EXP_PUBLISH_TEXTS.smText;
          } else {
            // For computer users or users operating in larger screen size
            // the creator exploration list will come back to its previously
            // selected view (card or list) when resized from mobile view
            ctrl.myExplorationsView = userDashboardDisplayPreference;
            ctrl.publishText = EXP_PUBLISH_TEXTS.defaultText;
          }
        };

        ctrl.updatesGivenScreenWidth();
        angular.element($window).bind('resize', function() {
          ctrl.updatesGivenScreenWidth();
        });

        ctrl.setExplorationsSortingOptions = function(sortType) {
          if (sortType === ctrl.currentSortType) {
            ctrl.isCurrentSortDescending = !ctrl.isCurrentSortDescending;
          } else {
            ctrl.currentSortType = sortType;
          }
        };

        ctrl.setSubscriptionSortingOptions = function(sortType) {
          if (sortType === ctrl.currentSubscribersSortType) {
            ctrl.isCurrentSubscriptionSortDescending = (
              !ctrl.isCurrentSubscriptionSortDescending);
          } else {
            ctrl.currentSubscribersSortType = sortType;
          }
        };

        ctrl.sortSubscriptionFunction = function(entity) {
          // This function is passed as a custom comparator function to
          // `orderBy`, so that special cases can be handled while sorting
          // subscriptions.
          var value = entity[ctrl.currentSubscribersSortType];
          if (ctrl.currentSubscribersSortType ===
              SUBSCRIPTION_SORT_BY_KEYS.IMPACT) {
            value = (value || 0);
          }
          return value;
        };

        var _fetchMessages = function(threadId) {
          $http.get('/threadhandler/' + threadId).then(function(response) {
            var allThreads = ctrl.mySuggestionsList.concat(
              ctrl.suggestionsToReviewList);
            for (var i = 0; i < allThreads.length; i++) {
              if (allThreads[i].threadId === threadId) {
                allThreads[i].setMessages(response.data.messages);
                break;
              }
            }
          });
        };

        ctrl.clearActiveThread = function() {
          ctrl.activeThread = null;
        };

        ctrl.setActiveThread = function(threadId) {
          _fetchMessages(threadId);
          for (var i = 0; i < ctrl.mySuggestionsList.length; i++) {
            if (ctrl.mySuggestionsList[i].threadId === threadId) {
              ctrl.activeThread = ctrl.mySuggestionsList[i];
              ctrl.canReviewActiveThread = false;
              break;
            }
          }
          if (!ctrl.activeThread) {
            for (var i = 0; i < ctrl.suggestionsToReviewList.length; i++) {
              if (ctrl.suggestionsToReviewList[i].threadId === threadId) {
                ctrl.activeThread = ctrl.suggestionsToReviewList[i];
                ctrl.canReviewActiveThread = true;
                break;
              }
            }
          }
        };

        ctrl.showSuggestionModal = function() {
          SuggestionModalForCreatorDashboardService.showSuggestionModal(
            ctrl.activeThread.suggestion.suggestionType,
            {
              activeThread: ctrl.activeThread,
              suggestionsToReviewList: ctrl.suggestionsToReviewList,
              clearActiveThread: ctrl.clearActiveThread,
              canReviewActiveThread: ctrl.canReviewActiveThread
            }
          );
        };

        ctrl.sortByFunction = function(entity) {
          // This function is passed as a custom comparator function to
          // `orderBy`, so that special cases can be handled while sorting
          // explorations.
          var value = entity[ctrl.currentSortType];
          if (entity.status === 'private') {
            if (ctrl.currentSortType === EXPLORATIONS_SORT_BY_KEYS.TITLE) {
              value = (value || ctrl.DEFAULT_EMPTY_TITLE);
            } else if (ctrl.currentSortType !==
                      EXPLORATIONS_SORT_BY_KEYS.LAST_UPDATED) {
              value = 0;
            }
          } else if (
            ctrl.currentSortType === EXPLORATIONS_SORT_BY_KEYS.RATING) {
            var averageRating = ctrl.getAverageRating(value);
            value = (averageRating || 0);
          }
          return value;
        };

        ctrl.getCompleteThumbnailIconUrl = function(iconUrl) {
          return UrlInterpolationService.getStaticImageUrl(iconUrl);
        };
      }
    ]
  };
}]);
