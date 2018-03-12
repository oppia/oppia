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
        'StateStatsService',
        function(
            $scope, EditorStateService, ExplorationStatesService,
            StateStatsService) {
          let MAXIMUM_UNRESOLVED_ANSWERS = 5;
          let MINIMUM_UNRESOLVED_ANSWER_FREQUENCY = 2;

          $scope.unresolvedAnswersData = [];

          $scope.computeUnresolvedAnswers = function() {
            let state = ExplorationStatesService.getState(
              EditorStateService.getActiveStateName());

            $scope.unresolvedAnswersData = [];
            $scope.lastRefreshDate = null;

            if (StateStatsService.stateSupportsIssuesOverview(state)) {
              StateStatsService.computeStateStats(state).then(function(stats) {
                let calculatedUnresolvedAnswersData = [];

                for (var i = 0; i !== stats.visualizations_info.length; ++i) {
                  let vizInfo = stats.visualizations_info[i];
                  if (!vizInfo.show_addressed_info) {
                    // Skip visualizations which don't support addressed
                    // information.
                    continue;
                  }

                  for (var j = 0; j !== vizInfo.data.length; ++j) {
                    let answer = vizInfo.data[j];
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
                  // Only take the first visualization with addressable answer
                  // data.
                  break;
                }

                // Only keep 5 unresolved answers.
                $scope.unresolvedAnswersData = calculatedUnresolvedAnswersData;
                $scope.lastRefreshDate = new Date();
              });
            }
          };

          $scope.$on('refreshStateEditor', $scope.computeUnresolvedAnswers);
        }
      ]
    };
  }]);
