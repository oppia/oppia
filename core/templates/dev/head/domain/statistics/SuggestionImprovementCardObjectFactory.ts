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

require('domain/statistics/ImprovementActionButtonObjectFactory.ts');
require('domain/statistics/statistics-domain.constants.ajs.ts');
require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvement-modal.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');
require(
  'pages/exploration-editor-page/suggestion-modal-for-editor-view/' +
  'suggestion-modal-for-exploration-editor.service.ts');

angular.module('oppia').factory('SuggestionImprovementCardObjectFactory', [
  '$q', 'ImprovementActionButtonObjectFactory', 'ImprovementModalService',
  'ThreadDataService', 'SUGGESTION_IMPROVEMENT_CARD_TYPE',
  function(
      $q, ImprovementActionButtonObjectFactory, ImprovementModalService,
      ThreadDataService, SUGGESTION_IMPROVEMENT_CARD_TYPE) {
    var SuggestionImprovementCard = function(suggestionThread) {
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew(
          'Review Thread', 'btn-primary',
          () => ImprovementModalService.openSuggestionThread(suggestionThread)),
      ];
      this._suggestionThread = suggestionThread;
    };

    /** @returns {string} - The actionable status of this card. */
    SuggestionImprovementCard.prototype.getStatus = function() {
      return this._suggestionThread.status;
    };

    /**
     * @returns {boolean} - Whether this card is no longer useful, and hence
     *    should be hidden away.
     */
    SuggestionImprovementCard.prototype.isObsolete = function() {
      return false; // Suggestion threads are always actionable.
    };

    /** @returns {string} - A simple summary of the suggestion thread. */
    SuggestionImprovementCard.prototype.getTitle = function() {
      return 'Suggestion for the card "' +
        this._suggestionThread.suggestion.stateName + '"';
    };

    /**
     * @returns {string} - The directive card type used to render details about
     *    this card's data.
     */
    SuggestionImprovementCard.prototype.getDirectiveData = function() {
      return this._suggestionThread;
    };

    /**
     * @returns {string} - Data required by the associated directive for
     *    rendering.
     */
    SuggestionImprovementCard.prototype.getDirectiveType = function() {
      return SUGGESTION_IMPROVEMENT_CARD_TYPE;
    };

    /**
     * @returns {ImprovementActionButton[]} - The array of action buttons
     *    displayed on the card.
     */
    SuggestionImprovementCard.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    return {
      /**
       * @returns {SuggestionImprovementCard}
       * @param {SuggestionThead} thread - The thread this card is referring to.
       */
      createNew: function(thread) {
        return new SuggestionImprovementCard(thread);
      },

      /**
       * @returns {Promise<SuggestionImprovementCard[]>} - The array of
       *    suggestion threads associated to the current exploration.
       */
      fetchCards: function() {
        var createNew = this.createNew;
        return ThreadDataService.fetchThreads().then(function() {
          return $q.all(
            ThreadDataService.data.suggestionThreads.map(function(suggestion) {
              return ThreadDataService.fetchMessages(suggestion.threadId);
            }));
        }).then(function() {
          return ThreadDataService.getData().suggestionThreads.map(createNew);
        });
      },
    };
  }
]);
