// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for visualizing multiple incorrect issue.
 */

oppia.directive('multipleIncorrectIssueDirective', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        // An integer representing the issue index.
        index: '&',
        // A read-only object representing the issue.
        issue: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/statistics_tab/' +
        'multiple_incorrect_issue_directive.html'),
      controller: [
        '$scope', '$uibModal', 'AlertsService', 'PlaythroughIssuesService',
        function($scope, $uibModal, AlertsService, PlaythroughIssuesService) {
          $scope.currentIssueIdentifier = $scope.index() + 1;

          var issue = $scope.issue();
          $scope.issueStatement =
            PlaythroughIssuesService.renderIssueStatement(issue);
          $scope.suggestions =
            PlaythroughIssuesService.renderIssueSuggestions(issue);
          $scope.playthroughIds = issue.playthroughIds;

          var getPlaythroughIndex = function(playthroughId) {
            return $scope.playthroughIds.indexOf(playthroughId);
          };

          $scope.createPlaythroughNavId = function(playthroughId) {
            return getPlaythroughIndex(playthroughId) + 1;
          };

          var issueResolved = false;
          $scope.resolveIssue = function() {
            if (!issueResolved) {
              PlaythroughIssuesService.resolveIssue(issue);
              AlertsService.addSuccessMessage(
                'Issue resolved. Refresh the page to view changes.');
              issueResolved = true;
            } else {
              AlertsService.addSuccessMessage(
                'Issue has already been resolved. No need to resolve again. ' +
                'Refresh the page to view changes.');
            }
          };

          $scope.showPlaythrough = function(playthroughId) {
            PlaythroughIssuesService.getPlaythrough(
              playthroughId
            ).then(function(playthrough) {
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
                    return $scope.playthroughIds.indexOf(playthroughId);
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
                        return runningTotal - displayBlock.length;
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
                      if (index === 0) {
                        return LearnerActionRenderService
                          .renderFinalDisplayBlockForMISIssueHTML(
                            displayBlock, blockActionIndexMapping[index]);
                      }
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
        }
      ]
    };
  }]);
