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
  'FEEDBACK_IMPROVEMENT_CARD_TYPE', function(FEEDBACK_IMPROVEMENT_CARD_TYPE) {
    /** @constructor */
    var FeedbackImprovementCard = function() {
    };

    /**
     * @returns {boolean} - Whether the improvement which this card suggests is
     *    open, i.e., still relevant and actionable.
     */
    FeedbackImprovementCard.prototype.isOpen = function() {
      return true;
    };

    /** @returns {string} - A concise summary of the card. */
    FeedbackImprovementCard.prototype.getTitle = function() {
      return "Feedback Thread";
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
     * @returns {{}}
     */
    FeedbackImprovementCard.prototype.getDirectiveData = function() {
      return {};
    };

    /**
     * @returns {ImprovementActionButton[]} - The list of action buttons
     *    displayed on the card.
     */
    FeedbackImprovementCard.prototype.getActionButtons = function() {
      return [];
    };

    return {
      /** @returns {FeedbackImprovementCard} */
      createNew: function() {
        return new FeedbackImprovementCard();
      },
      /**
       * @returns {Promise<FeedbackImprovementCard[]>} - The list of feedback
       *    threads associated to the current exploration.
       */
      fetchCards: function() {
        return Promise.resolve([]);
      },
    };
  }
]);
