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
 * @fileoverview Directive for visualizing early quit issue.
 */

oppia.directive('earlyQuitIssueDirective', [
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
        'early_quit_issue_directive.html'),
      controller: [
        '$scope', '$uibModal', 'IssuesService',
        function(
            $scope, $uibModal, IssuesService) {
          $scope.currentIssueIndex = $scope.index();

          var issue = $scope.issue();

          $scope.issueStatement = IssuesService.renderIssueStatement(issue);

          $scope.suggestions = IssuesService.renderIssueSuggestions(issue);

          $scope.playthroughIds = issue.playthroughIds;

          $scope.getPlaythroughIndex = function(playthroughId) {
            return $scope.playthroughIds.indexOf(playthroughId);
          };

          $scope.showPlaythrough = function(playthroughId) {
            IssuesService.getPlaythrough(
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
                    $scope.playthrough = playthrough;
                    $scope.playthroughIndex = playthroughIndex;

                    $scope.displayBlocks =
                      LearnerActionRenderService.getDisplayBlocks(
                        playthrough.actions);

                    var blockActionIndexMapping = {};
                    var i = $scope.displayBlocks.length - 1, accumulator = 1;
                    for (i; i >= 0; i--) {
                      blockActionIndexMapping[i] = accumulator;
                      accumulator += $scope.displayBlocks[i].length;
                    }

                    $scope.maxHidden = $scope.displayBlocks.length - 1;

                    $scope.getDisplayBlockIndex = function(displayBlock) {
                      return $scope.displayBlocks.indexOf(displayBlock);
                    };

                    $scope.renderBlockHtml = function(displayBlock) {
                      var index = $scope.getDisplayBlockIndex(displayBlock);
                      return LearnerActionRenderService.renderDisplayBlockHTML(
                        displayBlock, blockActionIndexMapping[index]);
                    };

                    $scope.showRemainingActions = function(pIdx) {
                      if (maxHidden === 1) {
                        document.getElementById(
                          'remainingActions' + pIdx.toString() +
                          maxHidden.toString()).style.display = 'block';
                        document.getElementById('arrowDiv').style.display =
                          'none';
                      } else {
                        var currentShown = 0, i;
                        for (i = maxHidden; i > 0; i--) {
                          if (document.getElementById(
                            'remainingActions' + pIdx.toString() +
                            i.toString()).style.display === 'block') {
                            currentShown = i;
                            break;
                          }
                        }
                        if (currentShown === 0) {
                          document.getElementById(
                            'remainingActions' + pIdx.toString() +
                            maxHidden.toString()).style.display = 'block';
                        } else if (currentShown === 2) {
                          document.getElementById(
                            'remainingActions' + pIdx.toString() +
                            '1').style.display = 'block';
                          document.getElementById(
                            'arrowDiv').style.display = 'none';
                        } else {
                          document.getElementById(
                            'remainingActions' + pIdx.toString() +
                            (currentShown - 1).toString()).style.display =
                              'block';
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
