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
 * @fileoverview Controllers for the exploration graph.
 */

oppia.controller('IssuesOverview', [
  '$scope', 'EditorStateService', 'ExplorationStatesService',
  'StateStatsService',
  function(
      $scope, EditorStateService, ExplorationStatesService,
      StateStatsService) {
    var htmlifyUnaddressedTextInputData = function(textInputAnswerData) {
      return textInputAnswerData;
    };

    var computeUnaddressedAnswers = function() {
      var state = ExplorationStatesService.getState(
        EditorStateService.getActiveStateName());

      // TODO(brianrodri): Move this check into a helper function in the
      // interaction interface.
      if (state.interaction.id === 'TextInput') {
        return Promise.resolve([]);
      } else {
        return StateStatsService.computeStateStats(state).then(
          function(stateRulesStats) {
            var unaddressedAnswers = [];
            stateRulesStats.visualizations_info.forEach(function(vizInfo) {
              if (vizInfo.show_addressed_info) {
                vizInfo.data.forEach(function(vizInfoDatum) {
                  if (!vizInfoDatum.is_addressed) {
                    unaddressedAnswers.push(
                      htmlifyUnaddressedTextInputData(vizInfoDatum));
                  }
                });
              }
            });
            return unaddressedAnswers;
          });
      }
    };

    $scope.unaddressedAnswers = [];

    $scope.$on('refreshStateEditor', function() {
      computeUnaddressedAnswers().then(function(updatedData) {
        $scope.unaddressedAnswers = updatedData;
      });
    });
  }
]);
