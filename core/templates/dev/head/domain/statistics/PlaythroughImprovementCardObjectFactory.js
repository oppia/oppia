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
  'ImprovementActionObjectFactory', 'PlaythroughIssuesService',
  function(ImprovementActionObjectFactory, PlaythroughIssuesService) {
    var renderImprovementCardContentHtml = function(issue) {
      /** @type {string[]} */
      var suggestions = PlaythroughIssuesService.renderIssueSuggestions(issue);
      var contentHtml = '';
      if (suggestions.length > 0) {
        contentHtml = '<ul><li>' + suggestions.join('</li><li>') + '</li></ul>';
      } else {
        // Do not add suggestions to the HTML response.
      }
      // TODO(brianrodri): Add hexagons.
      return contentHtml;
    };

    /** @constructor */
    var PlaythroughImprovementCard = function(issue) {
      /** @type {boolean} */
      this._isArchived = false;
      /** @type {string} */
      this._title = PlaythroughIssuesService.renderIssueStatement(issue);
      /** @type {string} */
      this._contentHtml = renderImprovementCardContentHtml(issue);

      var that = this;
      /** @type {ImprovementAction[]} */
      this._actions = [
        ImprovementActionObjectFactory.createNew('Archive', function() {
          return PlaythroughIssuesService.resolveIssue(issue).then(function() {
            that._isArchived = true;
          });
        }),
      ];
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
    PlaythroughImprovementCard.prototype.getContentHtml = function() {
      return this._contentHtml;
    };

    /**
     * @returns {ImprovementAction[]} - the list of action items a creator can
     * take to resolve the card.
     */
    PlaythroughImprovementCard.prototype.getActions = function() {
      return this._actions;
    };

    return {
      /** @returns {PlaythroughImprovementCard} */
      createNew: function(issue) {
        return new PlaythroughImprovementCard(issue);
      },
      /**
       * @returns {Promise<PlaythroughImprovementCard[]>} - the list of
       * playthrough issues associated to the current exploration.
       */
      fetchCards: function() {
        return PlaythroughIssuesService.getIssues().then(function(issues) {
          return issues.map(function(issue) {
            return new PlaythroughImprovementCard(issue);
          });
        });
      },
    };
  }
]);
