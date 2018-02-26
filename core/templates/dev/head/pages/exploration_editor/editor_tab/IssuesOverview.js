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
    $scope.unaddressedAnswersData = [];

    $scope.computeUnaddressedAnswers = function() {
      var state = ExplorationStatesService.getState(
        EditorStateService.getActiveStateName());
      var stateStatsPromise = StateStatsService.computeStateStats(state);

      // TODO(brianrodri): Move this check into the state interaction interface
      // as a helper function.
      if (state.interaction.id === 'TextInput') {
        stateStatsPromise.then(function(stateStats) {
          var unaddressedAnswersData = [];

          stateStats.visualizations_info.forEach(function(vizInfo) {
            if (vizInfo.show_addressed_info) {
              var unaddressedVizInfoData =
                vizInfo.data.filter(function(vizInfoDatum) {
                  return !vizInfoDatum.is_addressed;
                });
              unaddressedAnswersData =
                unaddressedAnswersData.concat(unaddressedVizInfoData);
            }
          });

          // Only keep 5 unaddressed answers.
          $scope.unaddressedAnswersData = unaddressedAnswersData.slice(0, 5);
        });
      } else {
        $scope.unaddressedAnswersData = [];
      }
    };

    $scope.$on('refreshStateEditor', $scope.computeUnaddressedAnswers);
  }
]);
