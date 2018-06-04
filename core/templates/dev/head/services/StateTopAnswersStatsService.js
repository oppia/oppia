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
 * @fileoverview Factory for maintaining the statistics of the top answers for
 * each state of an exploration.
 */

oppia.factory('StateTopAnswersStatsService', [
  '$http', '$injector', 'AngularNameService', 'AnswerClassificationService',
  'ExplorationContextService', 'ExplorationStatesService',
  'StateAnswerStatsFactory', 'UrlInterpolationService',
  function(
      $http, $injector, AngularNameService, AnswerClassificationService,
      ExplorationContextService, ExplorationStatesService,
      StateAnswerStatsFactory, UrlInterpolationService) {
    /** @type {Object.<string, StateAnswerStats[]>} */
    var stateTopAnswersCache = {};

    /**
     * @param {string} stateName - target state to have its addressed info
     * refreshed.
     */
    var refreshAddressedInfo = function(stateName) {
      var explorationId = ExplorationContextService.getExplorationId();
      var state = ExplorationStatesService.getState(stateName);
      var interactionRulesService = $injector.get(
        AngularNameService.getNameOfInteractionRulesService(
          state.interaction.id));
      stateTopAnswersCache[stateName].forEach(function(stateAnswerStats) {
        stateAnswerStats.isAddressed =
          AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
            explorationId, stateName, state, stateAnswerStats.answer,
            interactionRulesService);
      });
    };

    return {
      /**
       * Calls the backend asynchronously to setup the answer statistics of each
       * state this exploration contains.
       */
      init: function() {
        var explorationId = ExplorationContextService.getExplorationId();
        $http.get(
          UrlInterpolationService.interpolateUrl(
            '/createhandler/state_answer_stats/<exploration_id>',
            {exploration_id: explorationId})
        ).then(function(response) {
          stateTopAnswersCache = {};
          Object.keys(response.data.answers).forEach(function(stateName) {
            var stateAnswerStatsBackendDicts = response.data.answers[stateName];
            stateTopAnswersCache[stateName] = stateAnswerStatsBackendDicts.map(
              StateAnswerStatsFactory.createFromBackendDict);
            refreshAddressedInfo(stateName);
          });
        });
      },

      /**
       * @param {string} stateName
       * @returns {StateAnswerStats[]} - list of the statistics for the top
       *    answers.
       */
      getStateStats: function(stateName) {
        return angular.copy(stateTopAnswersCache[stateName]);
      },

      /**
       * Update all answers of the given state to reflect any changes in the
       * state's structure.
       * @param {string} stateName
       */
      refreshStateStats: function(stateName) {
        refreshAddressedInfo(stateName);
      },
    };
  }
]);
