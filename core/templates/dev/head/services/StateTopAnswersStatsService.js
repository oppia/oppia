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
  'AnswerStatsFactory', 'ExplorationContextService', 'ExplorationStatesService',
  'UrlInterpolationService',
  function(
      $http, $injector, AngularNameService, AnswerClassificationService,
      AnswerStatsFactory, ExplorationContextService, ExplorationStatesService,
      UrlInterpolationService) {
    /** @type {Object.<string, AnswerStats[]>} */
    var stateTopAnswerStatsCache = {};

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
      stateTopAnswerStatsCache[stateName].forEach(function(answerStats) {
        answerStats.isAddressed =
          AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
            explorationId, stateName, state, answerStats.answer,
            interactionRulesService);
      });
    };

    return {
      /**
       * Calls the backend asynchronously to setup the answer statistics of each
       * state this exploration contains.
       */
      init: function() {
        $http.get(
          UrlInterpolationService.interpolateUrl(
            '/createhandler/state_answer_stats/<exploration_id>',
            {exploration_id: ExplorationContextService.getExplorationId()})
        ).then(function(response) {
          stateTopAnswerStatsCache = {};
          Object.keys(response.data.answers).forEach(function(stateName) {
            var answerStatsBackendDicts = response.data.answers[stateName];
            stateTopAnswerStatsCache[stateName] = answerStatsBackendDicts.map(
              AnswerStatsFactory.createFromBackendDict);
            // Still need to manually refresh the addressed information.
            refreshAddressedInfo(stateName);
          });
        });
      },

      /**
       * @param {string} stateName
       * @returns {AnswerStats[]} - list of the statistics for the top answers.
       */
      getStateStats: function(stateName) {
        return angular.copy(stateTopAnswerStatsCache[stateName]);
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
