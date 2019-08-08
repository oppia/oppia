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
require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvement-modal.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');
require('domain/statistics/statistics-domain.constants.ajs.ts');

angular.module('oppia').factory('FeedbackImprovementCardObjectFactory', [
  '$q', 'ImprovementActionButtonObjectFactory', 'ImprovementModalService',
  'ThreadDataService', 'FEEDBACK_IMPROVEMENT_CARD_TYPE',
  function(
      $q, ImprovementActionButtonObjectFactory, ImprovementModalService,
      ThreadDataService, FEEDBACK_IMPROVEMENT_CARD_TYPE) {
    var FeedbackImprovementCard = function(feedbackThread) {
      this._feedbackThread = feedbackThread;
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew(
          'Review Thread', 'btn-primary', function() {
            ImprovementModalService.openFeedbackThread(feedbackThread);
          }),
      ];
    };

    /**
     * @returns {boolean} - Whether the improvement which this card suggests is
     *   open, i.e., still relevant and actionable.
     */
    FeedbackImprovementCard.prototype.isOpen = function() {
      return this._feedbackThread.status === 'open';
    };

    /** @returns {string} - A simple summary of the feedback thread */
    FeedbackImprovementCard.prototype.getTitle = function() {
      return this._feedbackThread.subject;
    };

    /**
     * @returns {string} - The directive card type used to render details about
     *   this card's data.
     */
    FeedbackImprovementCard.prototype.getDirectiveType = function() {
      return FEEDBACK_IMPROVEMENT_CARD_TYPE;
    };

    /**
     * @returns {string} - The directive card type used to render details about
     *   this card's data.
     */
    FeedbackImprovementCard.prototype.getDirectiveData = function() {
      return this._feedbackThread;
    };

    /**
     * @returns {ImprovementActionButton[]} - The array of action buttons
     *   displayed on the card.
     */
    FeedbackImprovementCard.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    return {
      /**
       * @returns {FeedbackImprovementCard}
       * @param {FeedbackThread} thread - The thread this card is referring to.
       */
      createNew: function(thread) {
        return new FeedbackImprovementCard(thread);
      },

      /**
       * @returns {Promise<FeedbackImprovementCard[]>} - The array of feedback
       *   threads associated to the current exploration.
       */
      fetchCards: function() {
        var createNew = this.createNew;
        return ThreadDataService.fetchThreads().then(function() {
          return $q.all(
            ThreadDataService.data.feedbackThreads.map(function(feedback) {
              return ThreadDataService.fetchMessages(feedback.threadId);
            }));
        }).then(function() {
          return ThreadDataService.getData().feedbackThreads.map(createNew);
        });
      },
    };
  }
]);
