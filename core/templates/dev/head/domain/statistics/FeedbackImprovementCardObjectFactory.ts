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
  '$timeout', '$uibModal', 'ChangeListService', 'ExplorationStatesService',
  'ImprovementActionButtonObjectFactory',
  'ShowSuggestionModalForEditorViewService', 'ThreadDataService',
  'UrlInterpolationService', 'UserService', 'FEEDBACK_IMPROVEMENT_CARD_TYPE',
  'SUGGESTION_IMPROVEMENT_CARD_TYPE',
  function(
      $timeout, $uibModal, ChangeListService, ExplorationStatesService,
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

    FeedbackThreadImprovementCard.prototype.getKey = function() {
      return this._feedbackThread.threadId;
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
    var SuggestionThreadImprovementCard = function(suggestionThread) {
      var thisCard = this;
      var enableShowSuggestionButton = function() {
        $timeout(function() {
          thisCard._isShowSuggestionButtonDisabled = false;
        });
      };
      var disableShowSuggestionButton = function() {
        $timeout(function() {
          thisCard._isShowSuggestionButtonDisabled = true;
        });
      };
      var showSuggestionModal = function() {
        disableShowSuggestionButton();
        ShowSuggestionModalForEditorViewService.showSuggestionModal(
          suggestionThread.suggestion.suggestionType, {
            activeThread: suggestionThread,
            hasUnsavedChanges: function() {
              return ChangeListService.getChangeList().length > 0;
            },
            isSuggestionHandled: function() {
              return suggestionThread.isSuggestionHandled();
            },
            isSuggestionValid: function() {
              return ExplorationStatesService.hasState(
                suggestionThread.getSuggestionStateName());
            },
            onResolveSuggestionSuccess: enableShowSuggestionButton,
            onResolveSuggestionFailure: enableShowSuggestionButton,
          }
        ).result.then(
          function() {
            // On $uibModalInstance.close(), the suggestion is being resolved by
            // the backend, so we will wait for the onResolveSuggestion handlers
            // above to enable the button.
          }, function() {
            // On $uibModalInstance.dismiss(), we need to re-enable the button
            // so that the creator can interact with it again.
            enableShowSuggestionButton();
          });
      };
      var showReviewThreadModal = function() {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/review_suggestion_thread_modal_directive.html'),
          resolve: {
            activeThread: function() {
              return thisCard._suggestionThread;
            },
            isUserLoggedIn: function() {
              return UserService.getUserInfoAsync().then(function(userInfo) {
                var isUserLoggedIn = userInfo.isLoggedIn();
                if (isUserLoggedIn) {
                  ThreadDataService.markThreadAsSeen(suggestionThread.threadId);
                }
                return isUserLoggedIn;
              });
            },
          },
          controller: 'ReviewSuggestionThreadModalController',
          backdrop: 'static',
          size: 'lg',
        });
      };

      /** @type {boolean} */
      this._isShowSuggestionButtonDisabled = false;
      /** @type {Suggestion} */
      this._suggestionThread = suggestionThread;
      /** @type {ImprovementActionButton[]} */
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew(
          'Review Thread', showReviewThreadModal, 'btn-success'),
        ImprovementActionButtonObjectFactory.createNew(
          'Review Suggestion', showSuggestionModal, 'btn-success', function() {
            return thisCard._isShowSuggestionButtonDisabled;
          }),
      ];
    };

    /**
     * @returns {boolean} - Whether the improvement which this card suggests is
     *    open, i.e., still relevant and actionable.
     */
    SuggestionThreadImprovementCard.prototype.isOpen = function() {
      return this._suggestionThread.status === 'open';
    };

    /** @returns {string} - A concise summary of the card. */
    SuggestionThreadImprovementCard.prototype.getTitle = function() {
      return (
        'Suggestion for the "' +
        this._suggestionThread.getSuggestionStateName() + '" Card');
    };

    SuggestionThreadImprovementCard.prototype.getKey = function() {
      return this._suggestionThread.threadId;
    };

    /** @returns {string} - The directive type used to render the card. */
    SuggestionThreadImprovementCard.prototype.getDirectiveType = function() {
      return SUGGESTION_IMPROVEMENT_CARD_TYPE;
    };

    /**
     * Provides the data necessary for the associated card directive to render
     * the details of this suggestion card. The associated directive is named:
     * SuggestionThreadImprovementCardDirective.js.
     *
     * @returns {Suggestion}
     */
    SuggestionThreadImprovementCard.prototype.getDirectiveData = function() {
      return this._suggestionThread;
    };

    /**
     * @returns {ImprovementActionButton[]} - The list of action buttons
     *    displayed on the card.
     */
    SuggestionThreadImprovementCard.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    return {
      /** @returns {Object} */
      createNew: function(feedback) {
        if (feedback.isSuggestionThread()) {
          return new SuggestionThreadImprovementCard(feedback);
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
        return ThreadDataService.fetchThreads().then(function() {
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
