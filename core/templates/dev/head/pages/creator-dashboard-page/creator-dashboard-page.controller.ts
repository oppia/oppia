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

// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
require('directives/AngularHtmlBindDirective.ts');
require('directives/MathjaxBindDirective.ts');
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
require(
  'components/forms/schema-based-editors/' +
  'schema-based-bool-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-choices-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-custom-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-dict-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-expression-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-float-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-html-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-int-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-list-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-unicode-editor.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-custom-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-dict-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-html-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-list-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-primitive-viewer.directive.ts');
require(
  'components/forms/schema-viewers/schema-based-unicode-viewer.directive.ts');
require('components/forms/schema-viewers/schema-based-viewer.directive.ts');
require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require('components/forms/custom-forms-directives/image-uploader.directive.ts');
require(
  'components/forms/custom-forms-directives/audio-file-uploader.directive.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.directive.ts');
require(
  'components/state-directives/answer-group-editor/' +
  'answer-group-editor.directive.ts');
require('components/state-directives/hint-editor/hint-editor.directive.ts');
require(
  'components/state-directives/outcome-editor/outcome-editor.directive.ts');
require(
  'components/state-directives/outcome-editor/' +
  'outcome-destination-editor.directive.ts');
require(
  'components/state-directives/outcome-editor/' +
  'outcome-feedback-editor.directive.ts');
require(
  'components/state-directives/response-header/response-header.directive.ts');
require('components/state-directives/rule-editor/rule-editor.directive.ts');
require(
  'components/state-directives/rule-editor/rule-type-selector.directive.ts');
require(
  'components/state-directives/solution-editor/solution-editor.directive.ts');
require(
  'components/state-directives/solution-editor/' +
  'solution-explanation-editor.directive.ts');
require('components/forms/custom-forms-directives/html-select.directive.ts');
require('services/AutoplayedVideosService.ts');
// ^^^ this block of requires should be removed ^^^

require(
  'components/common-layout-directives/common-elements/' +
  'sharing-links.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require('components/summary-tile/collection-summary-tile.directive.ts');
require('pages/exploration_player/PlayerConstants.ts');
require('pages/exploration_editor/feedback_tab/ThreadTableDirective.ts');

require('components/entity-creation-services/exploration-creation.service.ts');
require('components/ratings/rating-computation/rating-computation.service.ts');
require('domain/creator_dashboard/CreatorDashboardBackendApiService.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/suggestion/SuggestionObjectFactory.ts');
require('domain/suggestion/SuggestionThreadObjectFactory.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'TopicsAndSkillsDashboardBackendApiService.ts'
);

require('objects/templates/BooleanEditorDirective.ts');
require('objects/templates/CodeStringEditorDirective.ts');
require('objects/templates/CoordTwoDimEditorDirective.ts');
require('objects/templates/DragAndDropHtmlStringEditorDirective.ts');
require('objects/templates/DragAndDropPositiveIntEditorDirective.ts');
require('objects/templates/FilepathEditorDirective.ts');
require('objects/templates/FractionEditorDirective.ts');
require('objects/templates/GraphEditorDirective.ts');
require('objects/templates/GraphPropertyEditorDirective.ts');
require('objects/templates/HtmlEditorDirective.ts');
require('objects/templates/ImageWithRegionsEditorDirective.ts');
require('objects/templates/IntEditorDirective.ts');
require('objects/templates/ListOfSetsOfHtmlStringsEditorDirective.ts');
require('objects/templates/ListOfUnicodeStringEditorDirective.ts');
require('objects/templates/LogicErrorCategoryEditorDirective.ts');
require('objects/templates/LogicQuestionEditorDirective.ts');
require('objects/templates/MathLatexStringEditorDirective.ts');
require('objects/templates/MusicPhraseEditorDirective.ts');
require('objects/templates/NonnegativeIntEditorDirective.ts');
require('objects/templates/NormalizedStringEditorDirective.ts');
require('objects/templates/NumberWithUnitsEditorDirective.ts');
require('objects/templates/ParameterNameEditorDirective.ts');
require('objects/templates/RealEditorDirective.ts');
require('objects/templates/SanitizedUrlEditorDirective.ts');
require('objects/templates/SetOfHtmlStringEditorDirective.ts');
require('objects/templates/SetOfUnicodeStringEditorDirective.ts');
require('objects/templates/UnicodeStringEditorDirective.ts');

require('pages/exploration_editor/feedback_tab/ThreadStatusDisplayService.ts');
require(
  'pages/creator-dashboard-page/suggestion-modal-for-creator-view/' +
  'suggestion-modal-for-creator-view.service.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('services/AlertsService.ts');
require('services/DateTimeFormatService.ts');
require('services/UserService.ts');

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
  '$http', '$log', '$q', '$rootScope', '$scope', '$uibModal', '$window',
  'AlertsService', 'CreatorDashboardBackendApiService', 'DateTimeFormatService',
  'ExplorationCreationService', 'QuestionObjectFactory',
  'RatingComputationService', 'SuggestionModalForCreatorDashboardService',
  'SuggestionObjectFactory', 'SuggestionThreadObjectFactory',
  'ThreadStatusDisplayService', 'TopicsAndSkillsDashboardBackendApiService',
  'UrlInterpolationService', 'UserService', 'EXPLORATIONS_SORT_BY_KEYS',
  'EXPLORATION_DROPDOWN_STATS', 'FATAL_ERROR_CODES',
  'HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS',
  'HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS', 'SUBSCRIPTION_SORT_BY_KEYS',
  function(
      $http, $log, $q, $rootScope, $scope, $uibModal, $window,
      AlertsService, CreatorDashboardBackendApiService, DateTimeFormatService,
      ExplorationCreationService, QuestionObjectFactory,
      RatingComputationService, SuggestionModalForCreatorDashboardService,
      SuggestionObjectFactory, SuggestionThreadObjectFactory,
      ThreadStatusDisplayService, TopicsAndSkillsDashboardBackendApiService,
      UrlInterpolationService, UserService, EXPLORATIONS_SORT_BY_KEYS,
      EXPLORATION_DROPDOWN_STATS, FATAL_ERROR_CODES,
      HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS,
      HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS, SUBSCRIPTION_SORT_BY_KEYS) {
    var EXP_PUBLISH_TEXTS = {
      defaultText: (
        'This exploration is private. Publish it to receive statistics.'),
      smText: 'Publish the exploration to receive statistics.'
    };

    var userDashboardDisplayPreference =
      constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.CARD;

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

    $scope.canCreateCollections = null;
    $rootScope.loadingMessage = 'Loading';
    var userInfoPromise = UserService.getUserInfoAsync();
    userInfoPromise.then(function(userInfo) {
      $scope.canCreateCollections = userInfo.canCreateCollections();
    });

    var dashboardDataPromise = (
      CreatorDashboardBackendApiService.fetchDashboardData());
    dashboardDataPromise.then(
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
        $scope.topicSummaries = responseData.topic_summary_dicts;
        var numberOfCreatedSuggestions = (
          responseData.threads_for_created_suggestions_list.length);
        var numberOfSuggestionsToReview = (
          responseData.threads_for_suggestions_to_review_list.length);
        $scope.mySuggestionsList = [];
        for (var i = 0; i < numberOfCreatedSuggestions; i++) {
          if (responseData.created_suggestions_list.length !==
              numberOfCreatedSuggestions) {
            $log.error('Number of suggestions does not match number of ' +
                       'suggestion threads');
          }
          for (var j = 0; j < numberOfCreatedSuggestions; j++) {
            var suggestion = SuggestionObjectFactory.createFromBackendDict(
              responseData.created_suggestions_list[j]);
            var threadDict = (
              responseData.threads_for_created_suggestions_list[i]);
            if (threadDict.thread_id === suggestion.getThreadId()) {
              var suggestionThread = (
                SuggestionThreadObjectFactory.createFromBackendDicts(
                  threadDict, responseData.created_suggestions_list[j]));
              $scope.mySuggestionsList.push(suggestionThread);
            }
          }
        }
        $scope.suggestionsToReviewList = [];
        for (var i = 0; i < numberOfSuggestionsToReview; i++) {
          if (responseData.suggestions_to_review_list.length !==
              numberOfSuggestionsToReview) {
            $log.error('Number of suggestions does not match number of ' +
                       'suggestion threads');
          }
          for (var j = 0; j < numberOfSuggestionsToReview; j++) {
            var suggestion = SuggestionObjectFactory.createFromBackendDict(
              responseData.suggestions_to_review_list[j]);
            var threadDict = (
              responseData.threads_for_suggestions_to_review_list[i]);
            if (threadDict.thread_id === suggestion.getThreadId()) {
              var suggestionThread = (
                SuggestionThreadObjectFactory.createFromBackendDicts(
                  threadDict, responseData.suggestions_to_review_list[j]));
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
          $scope.activeTab = 'suggestions';
        } else {
          $scope.activeTab = 'myExplorations';
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

    $scope.getAverageRating = RatingComputationService.computeAverageRating;
    $scope.createNewExploration = (
      ExplorationCreationService.createNewExploration);
    $scope.getLocaleAbbreviatedDatetimeString = (
      DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
    $scope.enableQuestionSuggestions = constants.ENABLE_NEW_STRUCTURE_PLAYERS;
    $scope.getHumanReadableStatus = (
      ThreadStatusDisplayService.getHumanReadableStatus);

    $scope.emptyDashboardImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/general/empty_dashboard.svg');
    $scope.canReviewActiveThread = null;

    $scope.setActiveTab = function(newActiveTabName) {
      $scope.activeTab = newActiveTabName;
    };

    $scope.getExplorationUrl = function(explorationId) {
      return '/create/' + explorationId;
    };

    $scope.getCollectionUrl = function(collectionId) {
      return '/collection_editor/create/' + collectionId;
    };

    $scope.setMyExplorationsView = function(newViewType) {
      $http.post('/creatordashboardhandler/data', {
        display_preference: newViewType,
      }).then(function() {
        $scope.myExplorationsView = newViewType;
      });
      userDashboardDisplayPreference = newViewType;
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
        // For mobile users, the view of the creators
        // exploration list is shown only in
        // the card view and can't be switched to list view.
        $scope.myExplorationsView = (
          constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.CARD);
        $scope.publishText = EXP_PUBLISH_TEXTS.smText;
      } else {
        // For computer users or users operating in larger screen size
        // the creator exploration list will come back to its previously
        // selected view (card or list) when resized from mobile view
        $scope.myExplorationsView = userDashboardDisplayPreference;
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
      for (var i = 0; i < $scope.mySuggestionsList.length; i++) {
        if ($scope.mySuggestionsList[i].threadId === threadId) {
          $scope.activeThread = $scope.mySuggestionsList[i];
          $scope.canReviewActiveThread = false;
          break;
        }
      }
      if (!$scope.activeThread) {
        for (var i = 0; i < $scope.suggestionsToReviewList.length; i++) {
          if ($scope.suggestionsToReviewList[i].threadId === threadId) {
            $scope.activeThread = $scope.suggestionsToReviewList[i];
            $scope.canReviewActiveThread = true;
            break;
          }
        }
      }
    };

    $scope.showSuggestionModal = function() {
      SuggestionModalForCreatorDashboardService.showSuggestionModal(
        $scope.activeThread.suggestion.suggestionType,
        {
          activeThread: $scope.activeThread,
          suggestionsToReviewList: $scope.suggestionsToReviewList,
          clearActiveThread: $scope.clearActiveThread,
          canReviewActiveThread: $scope.canReviewActiveThread
        }
      );
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
      var topicSummaries = $scope.topicSummaries;
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/creator-dashboard-page/modal-templates/' +
          'create-question-modal.directive.html'),
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
        resolve: {},
        controller: [
          '$scope', '$uibModalInstance', function(
              $scope, $uibModalInstance) {
            $scope.question = question;
            $scope.topicId = null;
            $scope.topicSummaries = topicSummaries;
            $scope.misconceptions = [];
            $scope.errorMessage = null;

            $scope.isValidQuestion = function() {
              var errorMessage = $scope.question.validate([]);
              if (!$scope.topicId) {
                $scope.errorMessage = 'Please choose a topic before submitting';
              } else if (errorMessage === false) {
                $scope.errorMessage = null;
              } else {
                $scope.errorMessage = errorMessage;
              }
              return ($scope.question.validate([]) === false);
            };

            $scope.dismissModal = function() {
              $uibModalInstance.dismiss();
            };

            $scope.createQuestion = function() {
              var errorMessage = question.validate([]);
              if (!$scope.topicId) {
                $scope.errorMessage = 'Please choose a topic before submitting';
              } else if (errorMessage === false) {
                $scope.errorMessage = null;
                $uibModalInstance.close({
                  question: question,
                  topicId: $scope.topicId
                });
              } else {
                $scope.errorMessage = errorMessage;
              }
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
        if (!topicVersion) {
          $log.error('Unable to match topic id selected with topic choices.');
        }
        $http.post('/suggestionhandler/', {
          suggestion_type: 'add_question',
          target_type: 'topic',
          target_id: result.topicId,
          target_version_at_submission: topicVersion,
          change: {
            cmd: 'create_new_fully_specified_question',
            question_dict: result.question.toBackendDict(true),
            skill_id: null
          },
          description: null
        });
      }, function() {
        $log.error('Error while submitting question');
      });
    };
  }
]);
