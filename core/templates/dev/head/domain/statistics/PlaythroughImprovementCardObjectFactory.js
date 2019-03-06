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
 * @fileoverview Factory for creating Playthrough Cards in the Improvements Tab.
 *
 * NOTE: For testing and organizational purposes, improvement card object
 * factories should be registered in the ImprovementCardRegistryService! See
 * the corresponding file to see what functions are expected from cards, and how
 * to add new ones as necessary.
 */

oppia.factory('PlaythroughImprovementCardObjectFactory', [
  'ImprovementActionObjectFactory',
  function(ImprovementActionObjectFactory) {
    /** @constructor */
    var PlaythroughImprovementCard = function() {
      /** @type {boolean} */
      this._isArchived = false;

      var that = this;
      var archiveCardAction =
        ImprovementActionObjectFactory.createNew('Archive', function() {
          that._isArchived = true;
          // TODO(brianrodri): Add backend callout to mark playthrough issue as
          // resolved.
        });
      /** @type {ImprovementAction[]} */
      this._resolutionActions = [archiveCardAction];
    };

    /**
     * @returns {boolean} - Whether the Playthrough Issue has been marked as
     * manually resolved by the creator.
     */
    PlaythroughImprovementCard.prototype.isResolved = function() {
      return this._isArchived;
    };

    /** @returns {string} - a simple summary of the Playthrough Issue */
    PlaythroughImprovementCard.prototype.getTitle = function() {
      return 'TODO';
    };

    /**
     * @returns {string} - the HTML required to render the Playthrough items,
     * including sample playthroughs for creators to look at.
     */
    PlaythroughImprovementCard.prototype.getContentHtml = function() {
      return '<b>TODO</b>: Fill with hexagons!';
    };

    /**
     * @returns {ImprovementAction[]} - the list of action items a creator can
     * take to resolve the card.
     */
    PlaythroughImprovementCard.prototype.getActions = function() {
      return this._resolutionActions;
    };

    return {
      /** @returns {PlaythroughImprovementCard} */
      createNew: function() {
        return new PlaythroughImprovementCard();
      },
      /**
       * @returns {Promise<PlaythroughImprovementCard[]>} - the list of
       * playthrough issues associated to the current exploration.
       */
      fetchCards: function() {
        // TODO(brianrodri): Do a proper callout for real cards.
        return Promise.resolve([new PlaythroughImprovementCard()]);
      },
    };
  }
]);
