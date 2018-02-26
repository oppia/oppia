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
 * @fileoverview Factory for handling warnings and info messages.
 */

oppia.factory('StateRulesStatsService', [
  '$http', '$injector', 'AngularNameService', 'AnswerClassificationService',
  'ExplorationStatesService',
  function(
      $http, $injector, AngularNameService, AnswerClassificationService,
      ExplorationStatesService) {
    return {
      // Returns a promise which will provide details of a particular state's
      // answer-statistics and rules.
      getStateRulesStatsPromise: function(explorationId, stateName) {
        return $http.get(
          '/createhandler/state_rules_stats/' + explorationId + '/' +
          encodeURIComponent(stateName)
        ).then(function(response) {
          var state = ExplorationStatesService.getState(stateName);
          var rulesService = $injector.get(
            AngularNameService.getNameOfInteractionRulesService(
              state.interaction.id));

          var stateRulesStats = {
            state_name: stateName,
            exploration_id: explorationId,
            visualizations_info: response.data.visualizations_info
          };
          stateRulesStats.visualizations_info.forEach(function(vizInfo) {
            if (vizInfo.show_addressed_info) {
              vizInfo.data.forEach(function(datum) {
                datum.is_addressed = (
                  AnswerClassificationService
                    .isClassifiedExplicitlyOrGoesToNewState(
                      explorationId, stateName, state, datum.answer,
                      rulesService));
              });
            }
          });

          return stateRulesStats;
        });
      }
    };
  }
]);
