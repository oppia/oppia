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
  'StateRulesStatsService',
  function(
      $scope, EditorStateService, ExplorationStatesService,
      StateRulesStatsService) {
    // TODO(brianrodri): Refactor this function to be part of a visualization's
    // interface. The result will be placed inside of a table's <tr> element.
    var vizInfoAnswerDataToHtml = {
      TextInput: function(vizInfoData) {
        return JSON.stringify(vizInfoData, null, 2);
      }
    };

    var computeUnaddressedAnswers = function(state) {
      // TODO(brianrodri): This check should be part of a visuzlization's
      // interface.
      if (!vizInfoAnswerDataToHtml.hasOwnProperty(state.interaction.id)) {
        return Promise.resolve([]);
      } else {
        return StateRulesStatsService.computeStateRulesStats(state).then(
          function(stateRulesStats) {
            var unaddressedAnswersLists = [];
            stateRulesStats.visualizations_info.forEach(function(vizInfo) {
              if (vizInfo.show_addressed_info) {
                unaddressedAnswersLists = unaddressedAnswersLists.concat(
                  vizInfo.data.filter(function(vizInfoData) {
                    return !vizInfoData.is_addressed;
                  }).map(vizInfoAnswerDataToHtml[state.interaction.id]));
              }
            });
            return [].concat(...unaddressedAnswersLists);
          });
      }
    }

    $scope.unaddressedAnswerData = [];

    $scope.$on('refreshStateEditor', function() {
      computeUnaddressedAnswers(
        ExplorationStatesService.getState(
          EditorStateService.getActiveStateName())
      ).then(function(updatedData) {
        $scope.unaddressedAnswerData = updatedData;
      });
    });
  }
]);
