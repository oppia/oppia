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
 * @fileoverview Factory for creating Suggestion Cards in the Improvements Tab.
 */

oppia.constant('SUGGESTION_IMPROVEMENT_CARD_TYPE', 'suggestion');

oppia.factory('SuggestionImprovementCardObjectFactory', [
  '$uibModal', 'ChangeListService', 'ExplorationStatesService',
  'ImprovementActionButtonObjectFactory',
  'ShowSuggestionModalForEditorViewService', 'ThreadDataService',
  'SUGGESTION_IMPROVEMENT_CARD_TYPE',
  function(
      $uibModal, ChangeListService, ExplorationStatesService,
      ImprovementActionButtonObjectFactory,
      ShowSuggestionModalForEditorViewService, ThreadDataService,
      SUGGESTION_IMPROVEMENT_CARD_TYPE) {
    /** @constructor */
    var SuggestionImprovementCard = function(suggestionThread) {
      var card = this;
      var showSuggestionModal = function() {
        ShowSuggestionModalForEditorViewService.showSuggestionModal(
          suggestionThread.suggestion.suggestionType, {
            activeThread: suggestionThread,
            isSuggestionHandled: function() {
              return suggestionThread.isSuggestionHandled();
            },
            hasUnsavedChanges: function() {
              return ChangeListService.getChangeList().length > 0;
            },
            isSuggestionValid: function() {
              return ExplorationStatesService.hasState(
                suggestionThread.getSuggestionStateName());
            }
          }
        );
      };

      /** @type {SuggestionThread} */
      this._suggestionThread = suggestionThread;
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
      return this._suggestionThread.status !== 'review';
    };

    /** @returns {string} - A concise summary of the card. */
    SuggestionImprovementCard.prototype.getTitle = function() {
      return 'Suggestion';
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
     * @returns {SuggestionThread}
     */
    SuggestionImprovementCard.prototype.getDirectiveData = function() {
      return this._suggestionThread;
    };

    /**
     * @returns {ImprovementActionButton[]} - The list of action buttons
     *    displayed on the card.
     */
    SuggestionImprovementCard.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    return {
      /** @returns {SuggestionImprovementCard} */
      createNew: function(suggestionThread) {
        return new SuggestionImprovementCard(suggestionThread);
      },
      /**
       * @returns {Promise<SuggestionImprovementCard[]>} - The list of
       *    suggestion threads associated to the current exploration.
       */
      fetchCards: function() {
        var createNew = this.createNew;
        return Promise.all([
          ThreadDataService.fetchThreads(),
          ThreadDataService.fetchFeedbackStats(),
        ]).then(function() {
          var threads = ThreadDataService.data.suggestionThreads;
          return Promise.all(threads.map(function(thread) {
            return ThreadDataService.fetchMessages(thread.threadId);
          })).then(function() {
            return threads.map(createNew);
          });
        });
      },
    };
  }
]);
