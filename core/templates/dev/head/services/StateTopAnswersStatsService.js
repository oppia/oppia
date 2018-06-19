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
  'AnswerStatsObjectFactory', 'ExplorationContextService',
  'ExplorationStatesService',
  function(
      $injector, AngularNameService, AnswerClassificationService,
      AnswerStatsObjectFactory, ExplorationContextService,
      ExplorationStatesService) {
    /**
     * @typedef AnswerStatsCache
     * @property {AnswerStats[]} allAnswers
     * @property {AnswerStats[]} unresolvedAnswers
     */

    /** @type {Object.<string, AnswerStatsCache[]>} */
    var stateTopAnswersStatsCache = {};

    /** @type {boolean} */
    var isInitialized = false;

    /**
     * Updates the addressed info of all the answers cached for the given state
     * to reflect the state's current answer groups.
     * @param {string} stateName
     */
    var refreshAddressedInfo = function(stateName) {
      var explorationId = ExplorationContextService.getExplorationId();
      var state = ExplorationStatesService.getState(stateName);
      var interactionRulesService = $injector.get(
        AngularNameService.getNameOfInteractionRulesService(
          state.interaction.id));
      var allAnswersCacheEntry =
        stateTopAnswersStatsCache[stateName].allAnswers;
      var unresolvedAnswersCacheEntry =
        stateTopAnswersStatsCache[stateName].unresolvedAnswers;

      // Clear the unresolvedAnswers array since many answers may now have
      // different "addressed" values.
      unresolvedAnswersCacheEntry.length = 0;

      // Update the isAddressed data of each answer and put any unaddressed
      // answers into the unresolvedAnswers array.
      allAnswersCacheEntry.forEach(function(answerStats) {
        answerStats.isAddressed =
          AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
            explorationId, stateName, state, answerStats.answer,
            interactionRulesService);
        if (!answerStats.isAddressed) {
          unresolvedAnswersCacheEntry.push(answerStats);
        }
      });
    };

    var onStateAdded = function(stateName) {
      stateTopAnswersStatsCache[stateName] = {
        allAnswers: [],
        unresolvedAnswers: []
      };
    };

    var onStateDeleted = function(stateName) {
      delete stateTopAnswersStatsCache[stateName];
    };

    var onStateRenamed = function(oldStateName, newStateName) {
      onStateAdded(newStateName);
      // Swap the values before deleting.
      var cache = stateTopAnswersStatsCache;
      cache[newStateName] =
        [cache[oldStateName], (cache[oldStateName] = cache[newStateName])][0];
      onStateDeleted(oldStateName);
    };

    var onStateAnswerGroupsSaved = function(stateName) {
      refreshAddressedInfo(stateName);
    };

    return {
      /**
       * Calls the backend asynchronously to setup the answer statistics of each
       * state this exploration contains.
       *
       * @param {Object.<string, *>} stateTopAnswersStatsBackendDict - The
       *    backend representation of the state top answers statistics.
       */
      init: function(stateTopAnswersStatsBackendDict) {
        if (isInitialized) {
          return;
        }
        stateTopAnswersStatsCache = {};
        for (var stateName in stateTopAnswersStatsBackendDict.answers) {
          stateTopAnswersStatsCache[stateName] = {
            allAnswers: stateTopAnswersStatsBackendDict.answers[stateName].map(
              AnswerStatsObjectFactory.createFromBackendDict),
            unresolvedAnswers: []
          };
          // Still need to manually refresh the addressed information.
          refreshAddressedInfo(stateName);
        }
        ExplorationStatesService.registerOnStateAddedCallback(onStateAdded);
        ExplorationStatesService.registerOnStateDeletedCallback(onStateDeleted);
        ExplorationStatesService.registerOnStateRenamedCallback(onStateRenamed);
        ExplorationStatesService.registerOnStateAnswerGroupsSavedCallback(
          onStateAnswerGroupsSaved);
        isInitialized = true;
      },

      /** @returns {boolean} - Whether the cache is ready for use. */
      isInitialized: function() {
        return isInitialized;
      },

      /**
       * @returns {boolean} - Whether the cache contains any answers for the
       * given state.
       */
      hasStateStats: function(stateName) {
        return isInitialized &&
          stateTopAnswersStatsCache.hasOwnProperty(stateName) &&
          stateTopAnswersStatsCache[stateName].allAnswers.length > 0;
      },

      /**
       * @param {string} stateName
       * @returns {AnswerStats[]} - list of the statistics for the top answers.
       */
      getStateStats: function(stateName) {
        if (!stateTopAnswersStatsCache.hasOwnProperty(stateName)) {
          throw Error(stateName + ' does not exist.');
        }
        return stateTopAnswersStatsCache[stateName].allAnswers;
      },

      /**
       * @param {string} stateName
       * @returns {AnswerStats[]} - list of stats for answers that are
       *    unresolved.
       */
      getUnresolvedStateStats: function(stateName) {
        if (!stateTopAnswersStatsCache.hasOwnProperty(stateName)) {
          throw Error(stateName + ' does not exist.');
        }
        return stateTopAnswersStatsCache[stateName].unresolvedAnswers;
      },
    };
  }
]);
