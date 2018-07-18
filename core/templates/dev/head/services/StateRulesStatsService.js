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

oppia.factory('StateRulesStatsService', [
  '$http', '$injector', 'AngularNameService', 'AnswerClassificationService',
  'ContextService', 'UrlInterpolationService',
  function(
      $http, $injector, AngularNameService, AnswerClassificationService,
      ContextService, UrlInterpolationService) {
    return {
      /**
       * TODO(brianrodri): Consider moving this into a visualization domain
       * object.
       *
       * @param {Object!} state
       * @return {Boolean} whether given state has an implementation for
       *     displaying the issues overview tab in the State Editor.
       */
      stateSupportsIssuesOverview: function(state) {
        return state.interaction.id === 'TextInput';
      },

      /**
       * Returns a promise which will provide details of the given state's
       * answer-statistics.
       *
       * @param {Object!} state
       */
      computeStateRulesStats: function(state) {
        var interactionRulesService = $injector.get(
          AngularNameService.getNameOfInteractionRulesService(
            state.interaction.id));
        var explorationId = ContextService.getExplorationId();

        return $http.get(
          UrlInterpolationService.interpolateUrl(
            '/createhandler/state_rules_stats/<exploration_id>/<state_name>',
            {exploration_id: explorationId, state_name: state.name})
        ).then(function(response) {
          return {
            state_name: state.name,
            exploration_id: explorationId,
            visualizations_info: response.data.visualizations_info.map(
              function(vizInfo) {
                var vizInfoDataWithAddressedInfo = {};
                if (vizInfo.addressed_info_is_supported) {
                  vizInfoDataWithAddressedInfo = {
                    data: vizInfo.data.map(function(vizInfoDatum) {
                      return Object.assign({
                        is_addressed: (
                          AnswerClassificationService
                            .isClassifiedExplicitlyOrGoesToNewState(
                              explorationId, state.name, state,
                              vizInfoDatum.answer, interactionRulesService))
                      }, vizInfoDatum);
                    })
                  };
                }

                return Object.assign({}, vizInfo, vizInfoDataWithAddressedInfo);
              })
          };
        });
      }
    };
  }
]);
