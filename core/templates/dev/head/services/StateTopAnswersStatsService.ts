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

require('domain/exploration/AnswerStatsObjectFactory.ts');
require('pages/exploration-editor-page/services/angular-name.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require('services/ContextService.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('StateTopAnswersStatsService', [
  '$injector', 'AngularNameService', 'AnswerClassificationService',
  'AnswerStatsObjectFactory', 'ContextService', 'ExplorationStatesService',
  function(
      $injector, AngularNameService, AnswerClassificationService,
      AnswerStatsObjectFactory, ContextService, ExplorationStatesService) {
    /**
     * A collection of answers associated to a specific interaction id.
     * @typedef {Object} AnswerStatsCache
     * @property {AnswerStats[]} answers - the collection of answers.
     * @property {string} interactionId - the interaction id of the answers.
     */

    /** @type {boolean} */
    var isInitialized = false;
    /** @type {!Object.<string, AnswerStatsCache>} */
    var workingStateTopAnswersStats = {};

    /**
     * Updates the addressed info of all the answers cached for the given state
     * to reflect the state's current answer groups.
     * @param {string} stateName
     */
    var refreshAddressedInfo = function(stateName) {
      if (!workingStateTopAnswersStats.hasOwnProperty(stateName)) {
        throw Error(stateName + ' does not exist.');
      }

      var state = ExplorationStatesService.getState(stateName);
      var stateStats = workingStateTopAnswersStats[stateName];

      if (stateStats.interactionId !== state.interaction.id) {
        stateStats.answers.length = 0;
        stateStats.interactionId = state.interaction.id;
      }

      // Update the isAddressed property of each answer.
      var interactionRulesService = stateStats.interactionId === null ?
        null :
        $injector.get(AngularNameService.getNameOfInteractionRulesService(
          stateStats.interactionId));
      stateStats.answers.forEach(function(answerStats) {
        answerStats.isAddressed = interactionRulesService !== null &&
          AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
            stateName, state, answerStats.answer, interactionRulesService);
      });
    };

    var onStateAdded = function(stateName) {
      var state = ExplorationStatesService.getState(stateName);
      workingStateTopAnswersStats[stateName] =
        {answers: [], interactionId: state.interaction.id};
    };

    var onStateDeleted = function(stateName) {
      delete workingStateTopAnswersStats[stateName];
    };

    var onStateRenamed = function(oldStateName, newStateName) {
      workingStateTopAnswersStats[newStateName] =
        workingStateTopAnswersStats[oldStateName];
      delete workingStateTopAnswersStats[oldStateName];
    };

    var onStateInteractionSaved = function(stateName) {
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
        workingStateTopAnswersStats = {};
        for (var stateName in stateTopAnswersStatsBackendDict.answers) {
          workingStateTopAnswersStats[stateName] = {
            answers: stateTopAnswersStatsBackendDict.answers[stateName].map(
              AnswerStatsObjectFactory.createFromBackendDict),
            interactionId: (
              stateTopAnswersStatsBackendDict.interaction_ids[stateName]),
          };
          // Finally, manually refresh the addressed information.
          refreshAddressedInfo(stateName);
        }
        ExplorationStatesService.registerOnStateAddedCallback(onStateAdded);
        ExplorationStatesService.registerOnStateDeletedCallback(onStateDeleted);
        ExplorationStatesService.registerOnStateRenamedCallback(onStateRenamed);
        ExplorationStatesService.registerOnStateInteractionSavedCallback(
          onStateInteractionSaved);
        isInitialized = true;
      },

      /** @returns {boolean} - Whether the cache is ready for use. */
      isInitialized: function() {
        return isInitialized;
      },

      /** @returns {string[]} - list of state names with recorded stats. */
      getStateNamesWithStats: function() {
        return Object.keys(workingStateTopAnswersStats);
      },

      /**
       * @returns {boolean} - Whether the cache contains any answers for the
       * given state.
       */
      hasStateStats: function(stateName) {
        return this.isInitialized() &&
          workingStateTopAnswersStats.hasOwnProperty(stateName);
      },

      /**
       * @param {string} stateName
       * @returns {AnswerStats[]} - list of the statistics for the top answers.
       */
      getStateStats: function(stateName) {
        if (!this.hasStateStats(stateName)) {
          throw Error(stateName + ' does not exist.');
        }
        return workingStateTopAnswersStats[stateName].answers;
      },

      /**
       * @param {string} stateName
       * @returns {AnswerStats[]} - list of stats for answers that are
       *    unresolved.
       */
      getUnresolvedStateStats: function(stateName) {
        return this.getStateStats(stateName).filter(function(answerStats) {
          return !answerStats.isAddressed;
        });
      },
    };
  }
]);
