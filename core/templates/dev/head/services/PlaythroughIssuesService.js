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
 * @fileoverview Service for retrieving issues and playthroughs.
 */

oppia.factory('PlaythroughIssuesService', [
  '$uibModal', 'PlaythroughIssuesBackendApiService', 'UrlInterpolationService',
  'ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS', 'ISSUE_TYPE_EARLY_QUIT',
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
  function(
      $uibModal, PlaythroughIssuesBackendApiService, UrlInterpolationService,
      ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS, ISSUE_TYPE_EARLY_QUIT,
      ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
    var issues = null;
    var explorationId = null;
    var explorationVersion = null;
    var currentPlaythrough = null;

    var renderEarlyQuitIssueStatement = function() {
      return 'Several learners exited the exploration in less than a minute.';
    };

    var renderMultipleIncorrectIssueStatement = function(stateName) {
      return 'Several learners submitted answers to card "' + stateName +
        '" several times, then gave up and quit.';
    };

    var renderCyclicTransitionsIssueStatement = function(stateName) {
      return 'Several learners ended up in a cyclic loop revisiting card "' +
        stateName + '" many times.';
    };

    var renderEarlyQuitIssueSuggestions = function(issue) {
      var suggestions = [
        ('Review the cards up to and including "' +
          issue.issueCustomizationArgs.state_name.value + '" for errors, ' +
          'ambiguities, or insufficient motivation.'),
      ];
      return suggestions;
    };

    var renderMultipleIncorrectIssueSuggestions = function(stateName) {
      var suggestions = [
        ('Check the wording of the card "' + stateName + '" to ensure it is ' +
          'not confusing.'),
        ('Consider addressing the answers submitted in the sample ' +
          'playthroughs explicitly using answer groups.'),
      ];
      return suggestions;
    };

    var renderCyclicTransitionsIssueSuggestions = function(issue) {
      var stateNames = issue.issueCustomizationArgs.state_names.value;
      var finalIndex = stateNames.length - 1;
      var suggestions = [
        ('Check that the concept presented in "' + stateNames[0] + '" has ' +
          'been reinforced sufficiently by the time the learner gets to "' +
          stateNames[finalIndex] + '".'),
      ];
      return suggestions;
    };

    return {
      /** Prepares the PlaythroughIssuesService for subsequent calls to other
       * functions.
       *
       * @param {string} newExplorationId - the exploration id the service will
       *    be targeting.
       * @param {number} newExplorationVersion - the version of the exploration
       *    the service will be targeting.
       */
      initSession: function(newExplorationId, newExplorationVersion) {
        explorationId = newExplorationId;
        explorationVersion = newExplorationVersion;
      },
      getIssues: function() {
        return PlaythroughIssuesBackendApiService.fetchIssues(
          explorationId, explorationVersion);
      },
      getPlaythrough: function(playthroughId) {
        return PlaythroughIssuesBackendApiService.fetchPlaythrough(
          explorationId, playthroughId);
      },
      renderIssueStatement: function(issue) {
        var issueType = issue.issueType;
        if (issueType === ISSUE_TYPE_EARLY_QUIT) {
          return renderEarlyQuitIssueStatement();
        } else if (issueType === ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
          return renderMultipleIncorrectIssueStatement(
            issue.issueCustomizationArgs.state_name.value);
        } else if (issueType === ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS) {
          return renderCyclicTransitionsIssueStatement(
            issue.issueCustomizationArgs.state_names.value[0]);
        }
      },
      renderIssueSuggestions: function(issue) {
        var issueType = issue.issueType;
        if (issueType === ISSUE_TYPE_EARLY_QUIT) {
          return renderEarlyQuitIssueSuggestions(issue);
        } else if (issueType === ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
          return renderMultipleIncorrectIssueSuggestions(
            issue.issueCustomizationArgs.state_name.value);
        } else if (issueType === ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS) {
          return renderCyclicTransitionsIssueSuggestions(issue);
        }
      },
      resolveIssue: function(issue) {
        return PlaythroughIssuesBackendApiService.resolveIssue(
          issue, explorationId, explorationVersion);
      },
      openPlaythroughModal: function(playthroughId, index) {
        this.getPlaythrough(playthroughId).then(function(playthrough) {
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
                    getRemainingActionsElements(pIdx, $scope.maxHidden)
                      .style.display = 'block';
                    document.getElementById('arrowDiv').style.display = 'none';
                  } else {
                    var currentShown = 0;
                    var i;
                    for (i = $scope.maxHidden; i > 0; i--) {
                      if (getRemainingActionsElements(pIdx, i).style.display ===
                          'block') {
                        currentShown = i;
                        break;
                      }
                    }
                    if (currentShown === 0) {
                      getRemainingActionsElements(pIdx, currentShown + 1)
                        .style.display = 'block';
                    } else if (currentShown === $scope.maxHidden - 1) {
                      getRemainingActionsElements(pIdx, $scope.maxHidden)
                        .style.display = 'block';
                      document.getElementById('arrowDiv').style.display =
                        'none';
                    } else {
                      getRemainingActionsElements(pIdx, currentShown + 1)
                        .style.display = 'block';
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
      },
    };
  }]);
