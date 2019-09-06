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
 */

require('domain/statistics/ImprovementActionButtonObjectFactory.ts');
require('domain/statistics/statistics-domain.constants.ajs.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/exploration-editor-page/exploration-editor-page.constants.ts');
require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvement-modal.service.ts');
require('services/PlaythroughIssuesService.ts');

angular.module('oppia').factory('PlaythroughImprovementCardObjectFactory', [
  'ImprovementActionButtonObjectFactory', 'ImprovementModalService',
  'PlaythroughIssuesService', 'PLAYTHROUGH_IMPROVEMENT_CARD_TYPE',
  'STATUS_NOT_ACTIONABLE', 'STATUS_OPEN',
  function(
      ImprovementActionButtonObjectFactory, ImprovementModalService,
      PlaythroughIssuesService, PLAYTHROUGH_IMPROVEMENT_CARD_TYPE,
      STATUS_NOT_ACTIONABLE, STATUS_OPEN) {
    /**
     * @constructor
     * @param {PlaythroughIssue} issue - The issue this card is referring to.
     */
    var PlaythroughImprovementCard = function(issue) {
      /** @type {string} */
      this._title = PlaythroughIssuesService.renderIssueStatement(issue);
      /** @type {ImprovementActionButton[]} */
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew(
          'Mark as Resolved', 'btn-primary', () => {
            ImprovementModalService.openConfirmationModal(
              'Marking this action as resolved will discard the playthrough ' +
              'forever. Are you sure you want to proceed?',
              'Mark as Resolved', 'btn-danger')
              .result.then(() => PlaythroughIssuesService.resolveIssue(issue))
              .then(() => this._discarded = true);
          }),
      ];
      /** @type {boolean} */
      this._discarded = false;
      /** @type {Object} */
      this._directiveData = {
        title: this._title,
        suggestions: PlaythroughIssuesService.renderIssueSuggestions(issue),
        playthroughIds: issue.playthroughIds,
      };
    };

    /** @returns {string} - The actionable status of this card. */
    PlaythroughImprovementCard.prototype.getStatus = function() {
      return this._discarded ? STATUS_NOT_ACTIONABLE : STATUS_OPEN;
    };

    /**
     * @returns {boolean} - Whether this card is no longer useful, and hence
     *    should be hidden.
     */
    PlaythroughImprovementCard.prototype.isObsolete = function() {
      return this._discarded;
    };

    /** @returns {string} - A simple summary of the Playthrough Issue. */
    PlaythroughImprovementCard.prototype.getTitle = function() {
      return this._title;
    };

    /**
     * @returns {string} - The directive card type used to render details about
     *    this card's data.
     */
    PlaythroughImprovementCard.prototype.getDirectiveType = function() {
      return PLAYTHROUGH_IMPROVEMENT_CARD_TYPE;
    };

    /**
     * @returns {string} - Data required by the associated directive for
     *    rendering.
     */
    PlaythroughImprovementCard.prototype.getDirectiveData = function() {
      return this._directiveData;
    };

    /**
     * @returns {ImprovementActionButton[]} - The list of action buttons
     *    displayed on the card.
     */
    PlaythroughImprovementCard.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    return {
      /**
       * @returns {PlaythroughImprovementCard}
       * @param {PlaythroughIssue} issue - The issue this card is referring to.
       */
      createNew: function(issue) {
        return new PlaythroughImprovementCard(issue);
      },
      /**
       * @returns {Promise<PlaythroughImprovementCard[]>} - The list of
       *    playthrough issues associated to the current exploration.
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
