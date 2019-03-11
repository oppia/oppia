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

oppia.constant('PLAYTHROUGH_IMPROVEMENT_CARD_TYPE', 'playthrough');

oppia.factory('PlaythroughImprovementCardObjectFactory', [
  '$uibModal', 'ImprovementActionButtonObjectFactory',
  'PlaythroughIssuesService', 'UrlInterpolationService',
  'PLAYTHROUGH_IMPROVEMENT_CARD_TYPE',
  function(
      $uibModal, ImprovementActionButtonObjectFactory,
      PlaythroughIssuesService, UrlInterpolationService,
      PLAYTHROUGH_IMPROVEMENT_CARD_TYPE) {
    /**
     * @constructor
     * @param {PlaythroughIssue} issue - The issue this card is referring to.
     */
    var PlaythroughImprovementCard = function(issue) {
      var that = this;
      var discardThis = function() {
        return $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/confirmation_modal_directive.html'),
          backdrop: true,
          controller: [
            '$scope', '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.confirmationMessage =
                'Are you sure you want to discard this card?';
              $scope.confirmationButtonText = 'Discard';
              $scope.confirmationButtonClass = 'btn-danger';
              $scope.action = function() {
                $uibModalInstance.close();
              };
              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
              };
            }
          ]
        }).result.then(function() {
          PlaythroughIssuesService.resolveIssue(issue);
          that._isDiscarded = true;
        });
      };

      /** @type {boolean} */
      this._isDiscarded = false;
      /** @type {string} */
      this._title =
        PlaythroughIssuesService.renderIssueStatement(issue);
      /** @type {ImprovementActionButton[]} */
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew(
          'Discard', discardThis, 'btn-danger'),
      ];
      /** @type {{suggestions: string[], playthroughIds: string[]}} */
      this._directiveData = {
        suggestions:
          PlaythroughIssuesService.renderIssueSuggestions(issue),
        playthroughIds: issue.playthroughIds,
      };
    };

    /**
     * @returns {boolean} - Whether the improvement which this card suggests is
     * open, i.e., still relevant and actionable.
     */
    PlaythroughImprovementCard.prototype.isOpen = function() {
      return !this._isDiscarded;
    };

    /** @returns {string} - A simple summary of the Playthrough Issue */
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
     * Provides the data necessary for the associated card directive to render
     * the details of this playthrough card. The associated directive is named:
     * PlaythroughImprovementCardDirective.js.
     *
     * @returns {{suggestions: string[], playthroughIds: string[]}}
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
