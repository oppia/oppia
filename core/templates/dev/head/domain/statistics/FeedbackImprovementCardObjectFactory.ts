// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating Feedback Cards in the Improvements Tab.
 */

oppia.constant('FEEDBACK_IMPROVEMENT_CARD_TYPE', 'feedback');
oppia.constant('SUGGESTION_IMPROVEMENT_CARD_TYPE', 'suggestion');

oppia.factory('FeedbackImprovementCardObjectFactory', [
  '$uibModal', 'ChangeListService', 'ExplorationStatesService',
  'ImprovementActionButtonObjectFactory',
  'ShowSuggestionModalForEditorViewService', 'ThreadDataService',
  'UrlInterpolationService', 'UserService', 'FEEDBACK_IMPROVEMENT_CARD_TYPE',
  'SUGGESTION_IMPROVEMENT_CARD_TYPE',
  function(
      $uibModal, ChangeListService, ExplorationStatesService,
      ImprovementActionButtonObjectFactory,
      ShowSuggestionModalForEditorViewService, ThreadDataService,
      UrlInterpolationService, UserService, FEEDBACK_IMPROVEMENT_CARD_TYPE,
      SUGGESTION_IMPROVEMENT_CARD_TYPE) {
    /**
     * @constructor
     * @param {FeedbackThread} - feedback
     */
    var FeedbackThreadImprovementCard = function(feedbackThread) {
      var thisCard = this;
      var showReviewThreadModal = function() {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/review_feedback_thread_modal_directive.html'),
          resolve: {
            activeThread: function() {
              return thisCard._feedbackThread;
            },
            isUserLoggedIn: function() {
              return UserService.getUserInfoAsync().then(function(userInfo) {
                var isUserLoggedIn = userInfo.isLoggedIn();
                if (isUserLoggedIn) {
                  ThreadDataService.markThreadAsSeen(feedbackThread.threadId);
                }
                return isUserLoggedIn;
              });
            },
          },
          controller: 'ReviewFeedbackThreadModalController',
          backdrop: 'static',
          size: 'lg',
        });
      };

      /** @type {FeedbackThread} */
      this._feedbackThread = feedbackThread;
      /** @type {ImprovementActionButton[]} */
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew(
          'Review Thread', showReviewThreadModal, 'btn-success'),
      ];
    };

    /**
     * @returns {boolean} - Whether the improvement which this card suggests is
     *    open, i.e., still relevant and actionable.
     */
    FeedbackThreadImprovementCard.prototype.isOpen = function() {
      return this._feedbackThread.status === 'open';
    };

    /** @returns {string} - A concise summary of the card. */
    FeedbackThreadImprovementCard.prototype.getTitle = function() {
      return 'Feedback: ' + this._feedbackThread.subject;
    };

    /** @returns {string} - The directive type used to render the card. */
    FeedbackThreadImprovementCard.prototype.getDirectiveType = function() {
      return FEEDBACK_IMPROVEMENT_CARD_TYPE;
    };

    /**
     * Provides the data necessary for the associated card directive to render
     * the details of this feedback card. The associated directive is named:
     * FeedbackImprovementCardDirective.js.
     *
     * @returns {FeedbackThread}
     */
    FeedbackThreadImprovementCard.prototype.getDirectiveData = function() {
      return this._feedbackThread;
    };

    /**
     * @returns {ImprovementActionButton[]} - The list of action buttons
     *    displayed on the card.
     */
    FeedbackThreadImprovementCard.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    /**
     * @constructor
     * @param {Suggestion} - suggestion
     */
    var SuggestionImprovementCard = function(suggestion) {
      var showSuggestionModal = function() {
        ShowSuggestionModalForEditorViewService.showSuggestionModal(
          suggestion.suggestion.suggestionType, {
            activeThread: suggestion,
            hasUnsavedChanges: function() {
              return ChangeListService.getChangeList().length > 0;
            },
            isSuggestionHandled: function() {
              return suggestion.isSuggestionHandled();
            },
            isSuggestionValid: function() {
              return ExplorationStatesService.hasState(
                suggestion.getSuggestionStateName());
            },
          }
        );
      };

      /** @type {Suggestion} */
      this._suggestion = suggestion;
      /** @type {ImprovementActionButton[]} */
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew(
          'Review Suggestion', showSuggestionModal, 'btn-success'),
      ];
    };

    /**
     * @returns {boolean} - Whether the improvement which this card suggests is
     *    open, i.e., still relevant and actionable.
     */
    SuggestionImprovementCard.prototype.isOpen = function() {
      return this._suggestion.status !== 'review';
    };

    /** @returns {string} - A concise summary of the card. */
    SuggestionImprovementCard.prototype.getTitle = function() {
      return (
        'Suggestion for "' + this._suggestion.getSuggestionStateName() + '"');
    };

    /** @returns {string} - The directive type used to render the card. */
    SuggestionImprovementCard.prototype.getDirectiveType = function() {
      return SUGGESTION_IMPROVEMENT_CARD_TYPE;
    };

    /**
     * Provides the data necessary for the associated card directive to render
     * the details of this suggestion card. The associated directive is named:
     * SuggestionImprovementCardDirective.js.
     *
     * @returns {Suggestion}
     */
    SuggestionImprovementCard.prototype.getDirectiveData = function() {
      return this._suggestion;
    };

    /**
     * @returns {ImprovementActionButton[]} - The list of action buttons
     *    displayed on the card.
     */
    SuggestionImprovementCard.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    return {
      /** @returns {Object} */
      createNew: function(feedback) {
        if (feedback.isSuggestionThread()) {
          return new SuggestionImprovementCard(feedback);
        } else {
          return new FeedbackThreadImprovementCard(feedback);
        }
      },
      /**
       * @returns {Promise<Object[]>} - The list of feedback cards associated to
       *    the current exploration.
       */
      fetchCards: function() {
        var createNew = this.createNew;
        return Promise.all([
          ThreadDataService.fetchThreads(),
          ThreadDataService.fetchFeedbackStats(),
        ]).then(function() {
          var allFeedback = [].concat(
            ThreadDataService.data.feedbackThreads,
            ThreadDataService.data.suggestionThreads);
          return Promise.all(allFeedback.map(function(thread) {
            return ThreadDataService.fetchMessages(thread.threadId);
          })).then(function() {
            return allFeedback.map(createNew);
          });
        });
      },
    };
  }
]);
