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
  '$uibModal', 'ImprovementActionObjectFactory', 'PlaythroughIssuesService',
  'UrlInterpolationService',
  function(
      $uibModal, ImprovementActionObjectFactory, PlaythroughIssuesService,
      UrlInterpolationService) {
    var openPlaythroughModal = function(playthroughId, index) {
      PlaythroughIssuesService.getPlaythrough(playthroughId).then(
        function(playthrough) {
          $uibModal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/exploration_editor/statistics_tab/' +
              'playthrough_modal_directive.html'),
            backdrop: true,
            resolve: {
              playthrough: function() {
                return playthrough;
              },
              playthroughIndex: function() {
                return index;
              }
            },
            controller: [
              '$scope', '$uibModalInstance', 'playthroughIndex',
              'playthrough', 'AlertsService', 'LearnerActionRenderService',
              function(
                $scope, $uibModalInstance, playthroughIndex,
                playthrough, AlertsService, LearnerActionRenderService) {
                $scope.playthroughIndex = playthroughIndex;

                $scope.displayBlocks =
                  LearnerActionRenderService.getDisplayBlocks(
                    playthrough.actions);
                $scope.reversedDisplayBlocks =
                  $scope.displayBlocks.slice().reverse();

                var blockActionIndexMapping = {};
                $scope.displayBlocks.reduce(
                  function(runningTotal, displayBlock, i) {
                    blockActionIndexMapping[i] =
                      runningTotal - displayBlock.length;
                    return blockActionIndexMapping[i];
                  }, playthrough.actions.length + 1);

                $scope.maxHidden = $scope.displayBlocks.length - 1;

                $scope.getDisplayBlockIndex = function(displayBlock) {
                  return $scope.displayBlocks.indexOf(displayBlock);
                };

                $scope.isDisplayBlockOnInitDisplay = function(block) {
                  return $scope.getDisplayBlockIndex(block) === 0;
                };

                $scope.createDisplayBlockNavId = function(block) {
                  return $scope.getDisplayBlockIndex(block) + 1;
                };

                $scope.renderBlockHtml = function(displayBlock) {
                  var index = $scope.getDisplayBlockIndex(displayBlock);
                  return LearnerActionRenderService.renderDisplayBlockHTML(
                    displayBlock, blockActionIndexMapping[index]);
                };

                var getRemainingActionsElements = function(pIdx, i) {
                  return document.getElementById(
                    'remainingActions' + pIdx.toString() + i.toString());
                };

                /**
                 * Shows the remaining display blocks and the arrow div. If
                 * there is only one display block, the arrow div is not
                 * shown at all. If the current shown display block is the
                 * second last display block, the arrow div is hidden after
                 * the final display block is shown. Else, the following
                 * display block is displayed.
                 */
                $scope.showRemainingActions = function(pIdx) {
                  // If there is only one display block left to be shown,
                  // the arrow is not required.
                  if ($scope.maxHidden === 1) {
                    getRemainingActionsElements(
                      pIdx, $scope.maxHidden).style.display = 'block';
                    document.getElementById('arrowDiv').style.display =
                      'none';
                  } else {
                    var currentShown = 0, i;
                    for (i = $scope.maxHidden; i > 0; i--) {
                      if (getRemainingActionsElements(
                        pIdx, i).style.display === 'block') {
                        currentShown = i;
                        break;
                      }
                    }
                    if (currentShown === 0) {
                      getRemainingActionsElements(
                        pIdx, currentShown + 1).style.display = 'block';
                    } else if (currentShown === $scope.maxHidden - 1) {
                      getRemainingActionsElements(
                        pIdx, $scope.maxHidden).style.display = 'block';
                      document.getElementById(
                        'arrowDiv').style.display = 'none';
                    } else {
                      getRemainingActionsElements(
                        pIdx, currentShown + 1).style.display = 'block';
                    }
                  }
                };

                $scope.cancel = function() {
                  $uibModalInstance.dismiss('cancel');
                  AlertsService.clearWarnings();
                };
              }
            ]
          });
      });
    };

    var renderImprovementCardContentHtml = function(issue) {
      /** @type {string[]} */
      var suggestions = PlaythroughIssuesService.renderIssueSuggestions(issue);
      var contentHtml = '<p>Here are some tips for resolving this card:</p>';

      if (suggestions.length > 0) {
        contentHtml +=
          '<ul><li>' + suggestions.join('</li><li>') + '</li></ul>';
      }

      return contentHtml;
    };

    /** @constructor */
    var PlaythroughImprovementCard = function(issue) {
      var that = this;

      /** @type {boolean} */
      this._isArchived = false;
      /** @type {string} */
      this._title = PlaythroughIssuesService.renderIssueStatement(issue);
      /** @type {string} */
      this._contentHtml = renderImprovementCardContentHtml(issue);

      /** @type {ImprovementAction[]} */
      this._actions = [
        ImprovementActionObjectFactory.createNew('Archive', function() {
          return PlaythroughIssuesService.resolveIssue(issue).then(function() {
            that._isArchived = true;
          });
        }),
      ];

      issue.playthroughIds.forEach(function(playthroughId, index) {
        var title = 'View Sample Playthrough #' + (index + 1);
        that._actions.push(
          ImprovementActionObjectFactory.createNew(title, function() {
            openPlaythroughModal(playthroughId, index);
          }));
      });
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
