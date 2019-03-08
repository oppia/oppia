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
  'HtmlEscaperService', 'ImprovementActionButtonObjectFactory',
  'PlaythroughIssuesService',
  function(
      HtmlEscaperService, ImprovementActionButtonObjectFactory,
      PlaythroughIssuesService) {
    /** @constructor */
    var PlaythroughImprovementCard = function(playthroughIssue) {
      var that = this;
      var archiveThis = function() {
        return PlaythroughIssuesService.resolveIssue(
          playthroughIssue
        ).then(function() {
          that._isArchived = true;
        });
      };

      /** @type {boolean} */
      this._isArchived = false;
      /** @type {string} */
      this._title = PlaythroughIssuesService.renderIssueStatement(playthroughIssue);
      /** @type {ImprovementActionButton[]} */
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew('Archive', archiveThis),
      ];
      /** @type {{suggestions: string[], playthroughIds: string[]}} */
      this._directiveData = {
        suggestions:
          PlaythroughIssuesService.renderIssueSuggestions(playthroughIssue),
        playthroughIds: playthroughIssue.playthroughIds,
      };
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
      return this._title;
    };

    /**
     * @returns {string} - the HTML required to render the Playthrough items,
     * including sample playthroughs for creators to look at.
     */
    PlaythroughImprovementCard.prototype.getDirectiveType = function() {
      return "playthrough";
    };

    /** @returns {{suggestions: string[], playthroughIds: string[]}} */
    PlaythroughImprovementCard.prototype.getDirectiveData = function() {
      return this._directiveData;
    };

    /**
     * @returns {ImprovementActionButton[]} - the list of action items a creator
     * can take to resolve the card.
     */
    PlaythroughImprovementCard.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    return {
      /** @returns {PlaythroughImprovementCard} */
      createNew: function(playthroughIssue) {
        return new PlaythroughImprovementCard(playthroughIssue);
      },
      /**
       * @returns {Promise<PlaythroughImprovementCard[]>} - the list of
       * playthrough issues associated to the current exploration.
       */
      fetchCards: function() {
        return PlaythroughIssuesService.getIssues().then(function(issues) {
          return issues.map(function(playthroughIssue) {
            return new PlaythroughImprovementCard(playthroughIssue);
          });
        });
      },
    };
  }
]);
