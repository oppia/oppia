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


require('domain/statistics/ImprovementActionButtonObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('services/FeedbackIssuesService.ts');

require('domain/statistics/statistics-domain.constants.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('FeedbackImprovementCardObjectFactory', [
  '$q', 'ImprovementActionButtonObjectFactory', 'ThreadDataService',
  'UrlInterpolationService', 'FEEDBACK_IMPROVEMENT_CARD_TYPE',
  function(
      $q, ImprovementActionButtonObjectFactory, ThreadDataService,
      UrlInterpolationService, FEEDBACK_IMPROVEMENT_CARD_TYPE) {
    var FeedbackImprovementCard = function(feedbackThread) {
      this._actionButtons = [];
      this._feedbackThread = feedbackThread;
    };

    /**
     * @returns {boolean} - Whether the improvement which this card suggests is
     * open, i.e., still relevant and actionable.
     */
    FeedbackImprovementCard.prototype.isOpen = function() {
      return true;
    };

    /** @returns {string} - A simple summary of the Feedback Issue */
    FeedbackImprovementCard.prototype.getTitle = function() {
      return this._feedbackThread.subject;
    };

    /**
     * @returns {string} - The directive card type used to render details about
     *    this card's data.
     */
    FeedbackImprovementCard.prototype.getDirectiveType = function() {
      return FEEDBACK_IMPROVEMENT_CARD_TYPE;
    };

    /**
     * @returns {string} - The directive card type used to render details about
     *    this card's data.
     */
    FeedbackImprovementCard.prototype.getDirectiveData = function() {
      return this._feedbackThread;
    };

    /**
     * @returns {ImprovementActionButton[]} - The list of action buttons
     *    displayed on the card.
     */
    FeedbackImprovementCard.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    return {
      /**
       * @returns {SuggestionImprovementCard}
       * @param {SuggestionIssue} issue - The issue this card is referring to.
       */
      createNew: function(issue) {
        return new FeedbackImprovementCard(issue);
      },

      /**
       * @returns {Promise<SuggestionImprovementCard[]>} - The list of
       * suggestion issues associated to the current exploration.
       */
      fetchCards: function() {
        var createNew = this.createNew;
        ThreadDataService.fetchThreads().then(function() {
          return $q.all(
            ThreadDataService.data.suggestionThreads.map(function(suggestion) {
              return ThreadDataService.fetchMessages(suggestion.threadId);
            }));
        }).then(function() {
          return ThreadDataService.data.suggestionThreads.map(createNew);
        });
      },
    };
  }
]);
