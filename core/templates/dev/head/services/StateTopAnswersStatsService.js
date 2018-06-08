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

    var deleteState = function(stateName) {
      // No action needed, it's helpful to keep the old state data around just
      // in case a user decides to revert their changes.
    };

    var addState = function(stateName) {
      if (stateTopAnswerStatsCache.hasOwnProperty(stateName)) {
        // No action needed, we already have data available for this state.
      } else {
        // Prepare an empty set of answers, after all, a brand new state
        // couldn't possibly have any answers yet.
        stateTopAnswerStatsCache[stateName] = [];
      }
    };

    return {
      /**
       * Calls the backend asynchronously to setup the answer statistics of each
       * state this exploration contains.
       *
       * @param {?string[]} stateNames - Optional collection of states already
       *    known to exist. When they are not found in the backend, they will be
       *    given an empty set of top answers.
       */
      init: function(stateNames) {
        stateNames = stateNames || [];
        $http.get(
          UrlInterpolationService.interpolateUrl(
            '/createhandler/state_answer_stats/<exploration_id>',
            {exploration_id: ExplorationContextService.getExplorationId()})
        ).then(function(response) {
          stateTopAnswerStatsCache = {};
          stateNames.forEach(function(stateName) {
            stateTopAnswerStatsCache[stateName] = [];
          });
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

      onStateDelete: function(stateName) {
        deleteState(stateName);
      },

      onStateAdd: function(stateName) {
        addState(stateName);
      },

      /**
       * Update all answers of the given state to reflect any changes in the
       * state's structure.
       * @param {string} stateName
       */
      onStateChangeAnswerGroups: function(stateName) {
        refreshAddressedInfo(stateName);
      },

      onStateChangeName: function(oldStateName, newStateName) {
        var oldStateAnswerStats = stateTopAnswerStatsCache[oldStateName];
        deleteState(oldStateName);
        addState(newStateName);
        stateTopAnswerStatsCache[newStateName] = oldStateAnswerStats;
      },
    };
  }
]);
