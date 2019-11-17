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
 * @fileoverview Factory for calculating the statistics of a particular state.
 */

angular.module('oppia').factory('StateRulesStatsService', [
  '$http', '$injector', '$q', 'AngularNameService',
  'AnswerClassificationService', 'ContextService', 'FractionObjectFactory',
  function(
      $http, $injector, $q, AngularNameService,
      AnswerClassificationService, ContextService, FractionObjectFactory) {
    return {
      /**
       * TODO(brianrodri): Consider moving this into a visualization domain
       * object.
       *
       * @param {Object!} state
       * @return {Boolean} whether given state has an implementation for
       *     displaying the improvements overview tab in the State Editor.
       */
      stateSupportsImprovementsOverview: function(state) {
        return state.interaction.id === 'TextInput';
      },

      /**
       * Returns a promise which will provide details of the given state's
       * answer-statistics.
       *
       * @param {Object!} state
       * @returns {Promise}
       */
      computeStateRulesStats: function(state) {
        var explorationId = ContextService.getExplorationId();

        if (!state.interaction.id) {
          return $q.resolve({
            state_name: state.name,
            exploration_id: explorationId,
            visualizations_info: [],
          });
        }

        var interactionRulesService = $injector.get(
          AngularNameService.getNameOfInteractionRulesService(
            state.interaction.id));
        return $http.get(
          '/createhandler/state_rules_stats/' + [
            encodeURIComponent(explorationId),
            encodeURIComponent(state.name)
          ].join('/')
        ).then(function(response) {
          return {
            state_name: state.name,
            exploration_id: explorationId,
            visualizations_info: response.data.visualizations_info.map(
              function(vizInfo) {
                var newVizInfo = angular.copy(vizInfo);
                newVizInfo.data.forEach(function(vizInfoDatum) {
                  // If data is a FractionInput, need to change data so that
                  // visualization displays the input in a readable manner.
                  if (state.interaction.id === 'FractionInput') {
                    vizInfoDatum.answer =
                        FractionObjectFactory.fromDict(
                          vizInfoDatum.answer).toString();
                  }
                  if (newVizInfo.addressed_info_is_supported) {
                    vizInfoDatum.is_addressed =
                      AnswerClassificationService
                        .isClassifiedExplicitlyOrGoesToNewState(
                          state.name, state, vizInfoDatum.answer,
                          interactionRulesService);
                  }
                });
                return newVizInfo;
              })
          };
        });
      }
    };
  }
]);
