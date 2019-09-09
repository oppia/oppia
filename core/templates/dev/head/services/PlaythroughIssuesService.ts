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

require('domain/utilities/UrlInterpolationService.ts');
require('services/PlaythroughIssuesBackendApiService.ts');
require(
  'pages/exploration-editor-page/statistics-tab/services/' +
  'learner-action-render.service.ts');

angular.module('oppia').factory('PlaythroughIssuesService', [
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
              '/pages/exploration-editor-page/statistics-tab/templates/' +
              'playthrough-modal.template.html'),
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
              'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS',
              function(
                  $scope, $uibModalInstance, playthroughIndex,
                  playthrough, AlertsService, LearnerActionRenderService,
                  ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS) {
                $scope.playthroughIndex = playthroughIndex;

                $scope.startingIndices =
                  LearnerActionRenderService.getStartingIndices(
                    playthrough.actions);
                $scope.currentChoice = 0;

                $scope.isIssueMIS = false;
                if (playthrough.issueType === (
                  ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS)) {
                  $scope.isIssueMIS = true;
                }

                $scope.renderIssueTable = function() {
                  var lars = LearnerActionRenderService;
                  var tableHtml =
                    lars.renderFinalDisplayBlockForMISIssueHTML(
                      playthrough.actions.slice($scope.startingIndices[0]),
                      $scope.startingIndices[0] + 1);
                  return tableHtml;
                };

                $scope.maxHidden = $scope.startingIndices.length - 1;

                /**
                 * Returns the list of learner actions to currently be
                 * displayed in the playthrough modal.
                 * @returns {LearnerAction[]}
                 */
                $scope.getActionsToRender = function() {
                  if ($scope.isIssueMIS) {
                    return playthrough.actions.slice(
                      $scope.startingIndices[$scope.currentChoice],
                      $scope.startingIndices[0]);
                  }
                  return playthrough.actions.slice(
                    $scope.startingIndices[$scope.currentChoice]);
                };

                /**
                 * Returns the index of the learner action.
                 * @param {LearnerAction} learnerAction.
                 * @returns {int}
                 */
                $scope.getLearnerActionIndex = function(learnerAction) {
                  return playthrough.actions.indexOf(learnerAction) + 1;
                };

                /**
                 * Computes whether the learner action needs to be highlighted.
                 * @param {LearnerAction} learnerAction.
                 * @returns {boolean}
                 */
                $scope.isActionHighlighted = function(action) {
                  if ($scope.startingIndices.length === 0) {
                    return false;
                  }
                  return $scope.getLearnerActionIndex(action) > (
                    $scope.startingIndices[0]);
                };

                /**
                 * Renders the HTML of the learner action.
                 * @param {LearnerAction} learnerAction.
                 * @param {int} actionIndex - The index of the learner action.
                 * @returns {string}
                 */
                $scope.renderLearnerAction = function(
                    learnerAction, actionIndex) {
                  return LearnerActionRenderService.renderLearnerAction(
                    learnerAction, actionIndex);
                };


                /**
                 * Expands the displayed learner actions by the next start
                 * index. If there is only one index, the arrow div is not shown
                 * at all. If the current stop index is the second last one, the
                 * arrow div is hidden after the final stop is reached.
                 */
                $scope.expandActionsToRender = function(pIdx) {
                  if ($scope.maxHidden === 1) {
                    $scope.currentChoice += 1;
                    document.getElementById('arrowDiv').style.display = 'none';
                  } else {
                    $scope.currentChoice += 1;
                    if ($scope.currentChoice === $scope.maxHidden) {
                      document.getElementById('arrowDiv').style.display =
                        'none';
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
