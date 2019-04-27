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

oppia.factory('FeedbackImprovementCardObjectFactory', [
  'ImprovementActionButtonObjectFactory', 'ThreadDataService',
  'FEEDBACK_IMPROVEMENT_CARD_TYPE',
  function(
      ImprovementActionButtonObjectFactory, ThreadDataService,
      FEEDBACK_IMPROVEMENT_CARD_TYPE) {
    /** @constructor */
    var FeedbackImprovementCard = function(feedbackThread) {
      var openReviewThreadModal = function() {
        // TODO.
      };

      /** @type {FeedbackThread} */
      this._feedbackThread = feedbackThread;
      /** @type {ImprovementActionButton[]} */
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew(
          'Review Thread', openReviewThreadModal, 'btn-success'),
      ];
    };

    /**
     * @returns {boolean} - Whether the improvement which this card suggests is
     *    open, i.e., still relevant and actionable.
     */
    FeedbackImprovementCard.prototype.isOpen = function() {
      return this._feedbackThread.status === 'open';
    };

    /** @returns {string} - A concise summary of the card. */
    FeedbackImprovementCard.prototype.getTitle = function() {
      return 'Feedback Thread: ' + this._feedbackThread.subject;
    };

    /** @returns {string} - The directive type used to render the card. */
    FeedbackImprovementCard.prototype.getDirectiveType = function() {
      return FEEDBACK_IMPROVEMENT_CARD_TYPE;
    };

    /**
     * Provides the data necessary for the associated card directive to render
     * the details of this feedback card. The associated directive is named:
     * FeedbackImprovementCardDirective.js.
     *
     * @returns {FeedbackThread}
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
      /** @returns {FeedbackImprovementCard} */
      createNew: function(feedbackThread) {
        return new FeedbackImprovementCard(feedbackThread);
      },
      /**
       * @returns {Promise<FeedbackImprovementCard[]>} - The list of feedback
       *    threads associated to the current exploration.
       */
      fetchCards: function() {
        var createNew = this.createNew;
        return ThreadDataService.fetchThreads().then(function() {
          feedbackThreads = ThreadDataService.data.feedbackThreads;
          return Promise.all(feedbackThreads.map(function(thread) {
            return ThreadDataService.fetchMessages(thread.threadId);
          })).then(function() {
            return ThreadDataService.data.feedbackThreads.map(createNew);
          });
        });
      },
    };
  }
]);
