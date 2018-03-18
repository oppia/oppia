// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the state graph visualization.
 */

oppia.directive('unresolvedAnswersOverview', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'unresolved_answers_overview_directive.html'),
      controller: [
        '$scope', 'EditorStateService', 'ExplorationStatesService',
        'StateRulesStatsService',
        function(
            $scope, EditorStateService, ExplorationStatesService,
            StateRulesStatsService) {
          var MAXIMUM_UNRESOLVED_ANSWERS = 5;
          var MINIMUM_UNRESOLVED_ANSWER_FREQUENCY = 2;

          $scope.unresolvedAnswersData = null;
          $scope.latestRefreshDate = new Date();

          $scope.computeUnresolvedAnswers = function() {
            var state = ExplorationStatesService.getState(
              EditorStateService.getActiveStateName()
            );

            if (!StateRulesStatsService.stateSupportsIssuesOverview(state)) {
              $scope.unresolvedAnswersData = [];
            } else {
              StateRulesStatsService.computeStateRulesStats(
                state
              ).then(function(stats) {
                var calculatedUnresolvedAnswersData = [];

                for (var i = 0; i < stats.visualizations_info.length; ++i) {
                  var vizInfo = stats.visualizations_info[i];
                  if (!vizInfo.addressed_info_is_supported) {
                    continue;
                  }

                  // NOTE: vizInfo.data is already sorted in descending order by
                  // frequency.
                  for (var j = 0; j < vizInfo.data.length; ++j) {
                    var answer = vizInfo.data[j];
                    if (answer.is_addressed ||
                        answer.frequency <
                          MINIMUM_UNRESOLVED_ANSWER_FREQUENCY) {
                      continue;
                    }

                    calculatedUnresolvedAnswersData.push(answer);
                    if (calculatedUnresolvedAnswersData.length ===
                          MAXIMUM_UNRESOLVED_ANSWERS) {
                      break;
                    }
                  }

                  // Will only take the answers from first eligible
                  // visualization.
                  break;
                }

                $scope.unresolvedAnswersData = calculatedUnresolvedAnswersData;
                $scope.latestRefreshDate = new Date();
              });
            }
          };

          $scope.$on('refreshStateEditor', $scope.computeUnresolvedAnswers);
        }
      ]
    };
  }]);
