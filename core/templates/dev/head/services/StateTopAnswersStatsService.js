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
  '$injector', '$rootScope', 'AngularNameService',
  'AnswerClassificationService', 'AnswerStatsObjectFactory',
  'ExplorationContextService', 'ExplorationStatesService',
  'UrlInterpolationService', 'STATE_ADDED_EVENT_NAME',
  'STATE_DELETED_EVENT_NAME', 'STATE_RENAMED_EVENT_NAME',
  'STATE_INTERACTION_ANSWER_GROUPS_SAVED_EVENT_NAME',
  function(
      $injector, $rootScope, AngularNameService,
      AnswerClassificationService, AnswerStatsObjectFactory,
      ExplorationContextService, ExplorationStatesService,
      UrlInterpolationService, STATE_ADDED_EVENT_NAME,
      STATE_DELETED_EVENT_NAME, STATE_RENAMED_EVENT_NAME,
      STATE_INTERACTION_ANSWER_GROUPS_SAVED_EVENT_NAME) {
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
     * to reflect any changes in the state's answer groups.
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

      // Clear the unresolved answers array since many answers may now have
      // different values.
      unresolvedAnswers.splice(0, unresolvedAnswers.length);

      // Update the isAddressed data of each answer and put any unaddressed
      // answers into the unresolvedAnswers array.
      allAnswers.forEach(function(answerStats) {
        answerStats.isAddressed =
          AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
            explorationId, stateName, state, answerStats.answer,
            interactionRulesService);

        if (!answerStats.isAddressed) {
          unresolvedAnswers.push(answerStats);
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
      stateTopAnswersStatsCache[newStateName] =
        angular.copy(stateTopAnswersStatsCache[oldStateName]);
      delete stateTopAnswersStatsCache[oldStateName];
    };

    var onStateInteractionAnswerGroupsSaved = function(stateName) {
      refreshAddressedInfo(args.state_name);
    };

    $rootScope.$on(STATE_ADDED_EVENT_NAME, function(event, args) {
      if (!isInitialized) {
        return;
      }
      onStateAdded(args.state_name);
    });

    $rootScope.$on(STATE_DELETED_EVENT_NAME, function(event, args) {
      if (!isInitialized) {
        return;
      }
      onStateDeleted(args.state_name);
    });

    $rootScope.$on(STATE_RENAMED_EVENT_NAME, function(event, args) {
      if (!isInitialized) {
        return;
      }
      onStateRenamed(args.old_state_name, args.new_state_name);
    });

    $rootScope.$on(
      STATE_INTERACTION_ANSWER_GROUPS_SAVED_EVENT_NAME, function(event, args) {
        if (!isInitialized) {
          return;
        }
        onStateInteractionAnswerGroupsSaved(args.state_name);
      });

    return {
      /**
       * Calls the backend asynchronously to setup the answer statistics of each
       * state this exploration contains.
       *
       * @param {Object.<string, *>} stateTopAnswersStatsBackendDict - The
       *    backend representation of the state top answers statistics.
       */
      init: function(stateTopAnswersStatsBackendDict) {
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
        isInitialized = true;
      },

      /** @returns {boolean} - Whether the cache is ready for use. */
      isInitialized: function() {
        return isInitialized;
      },

      /**
       * @param {string} stateName
       * @returns {AnswerStats[]} - list of the statistics for the top answers.
       */
      getStateStats: function(stateName) {
        return stateTopAnswersStatsCache[stateName].allAnswers || [];
      },

      /**
       * @param {string} stateName
       * @returns {AnswerStats[]} - list of stats for answers that are
       *    unresolved.
       */
      getUnresolvedStateStats: function(stateName) {
        return stateTopAnswersStatsCache[stateName].unresolvedAnswers || [];
      },
    };
  }
]);
