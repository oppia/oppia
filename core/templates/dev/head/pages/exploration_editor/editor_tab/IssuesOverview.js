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
 * @fileoverview Controller for the issues overview card.
 */

oppia.controller('IssuesOverview', [
  '$scope', 'EditorStateService', 'ExplorationStatesService',
  'StateStatsService',
  function(
      $scope, EditorStateService, ExplorationStatesService,
      StateStatsService) {
    var MAXIMUM_UNRESOLVED_ANSWERS = 5;
    var MINIMUM_UNRESOLVED_ANSWER_FREQUENCY = 2;

    $scope.unresolvedAnswersData = [];

    $scope.computeUnresolvedAnswers = function() {
      var state = ExplorationStatesService.getState(
        EditorStateService.getActiveStateName());

      // TODO(brianrodri): Move this check into the state interaction interface
      // as a helper function.
      if (state.interaction.id === 'TextInput') {
        StateStatsService.computeStateStats(state).then(function(stateStats) {
          var unresolvedAnswersData = [];

          for (vizInfo of stateStats.visualizations_info) {
            if (!vizInfo.show_addressed_info) {
              // Skip visualizations which don't support addressed information.
              continue;
            }

            for (datum of vizInfo.data) {
              if (datum.is_addressed ||
                  datum.frequency < MINIMUM_UNRESOLVED_ANSWER_FREQUENCY) {
                continue;
              }

              unresolvedAnswersData.push(datum);
              if (unresolvedAnswersData.length === MAXIMUM_UNRESOLVED_ANSWERS) {
                break;
              }
            }
            if (unresolvedAnswersData.length === MAXIMUM_UNRESOLVED_ANSWERS) {
              break;
            }
          }

          // Only keep 5 unresolved answers.
          $scope.unresolvedAnswersData = unresolvedAnswersData;
        });
      } else {
        $scope.unresolvedAnswersData = [];
      }
    };

    $scope.$on('refreshStateEditor', $scope.computeUnresolvedAnswers);
  }
]);
