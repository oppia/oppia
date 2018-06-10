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
  '$injector', 'AngularNameService', 'AnswerClassificationService',
  'AnswerStatsFactory', 'ExplorationContextService', 'ExplorationStatesService',
  'UrlInterpolationService',
  function(
      $injector, AngularNameService, AnswerClassificationService,
      AnswerStatsFactory, ExplorationContextService, ExplorationStatesService,
      UrlInterpolationService) {
    /** @type {Object.<string, AnswerStats[]>} */
    var stateTopAnswerStatsCache = {};

    /** @type {boolean} */
    var isInitialized = false;

    /**
     * Updates the addressed info of all the answers cached for the given state
     * to reflect any changes in the state's answer groups.
     * @param {string} stateName
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
      init: function(stateTopAnswersStatsBackendDict) {
        stateTopAnswerStatsCache = {};
        for (var stateName in stateTopAnswersStatsBackendDict.answers) {
          stateTopAnswerStatsCache[stateName] =
            stateTopAnswersStatsBackendDict.answers[stateName].map(
              AnswerStatsFactory.createFromBackendDict
            );
          // Still need to manually refresh the addressed information.
          refreshAddressedInfo(stateName);
        }
        isInitialized = true;
      },

      isInitialized: function() {
        return isInitialized;
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
