// Copyright 2016 The Oppia Authors. All Rights Reserved.  //
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
 * @fileoverview Factory for fetching and maintaining top answers for an
 * exploration's states.
 */

oppia.factory('StateAnswerStatisticsService', [
  '$http', '$injector', 'ExplorationContextService', 'UrlInterpolationService',
  function(
      $http, $injector, ExplorationContextService, UrlInterpolationService) {
    /**
     * @typedef {Object} StateAnswerStats
     * @property {*} answer
     * @property {number} frequency
     * @property {boolean} isAddressed
     */

    var StateAnswerStatisticsService = {
      /** @type {Object.<string, StateAnswerStats[]>} */
      _cache: {},
    };

    /** @returns {Promise} for testing only. */
    StateAnswerStatisticsService.init = function() {
      var that = this;
      return $http.get(
        UrlInterpolationService.interpolateUrl(
          'createhandler/state_answer_stats/<exploration_id>', {
            exploration_id: ExplorationContextService.getExplorationId(),
          })
      ).then(function(response) {
        Object.keys(response.data.answers).forEach(function(stateName) {
          that._cache[stateName] = response.data.answers[stateName].map(
            /**
             * @param {{answer, frequency: number}} stateAnswerStatsBackendDict
             * @returns {StateAnswerStats}
             */
            function(stateAnswerStatsBackendDict) {
              /** @type {StateAnswerStats} */
              return {
                answer: stateAnswerStatsBackendDict.answer,
                frequency: stateAnswerStatsBackendDict.frequency,
                isAddressed: true, // Properly set by computeAddressedInfo.
              };
            });
        });
      });
    };

    /**
     * TODO
     *
     * @param {string} stateName
     */
    StateAnswerStatisticsService.hasUnresolvedAnswers = function(stateName) {
      return this._cache[stateName].some(function(stats) {
        return stats.isAddressed === false;
      });
    };

    StateAnswerStatisticsService.computeAddressedInfo = function(stateName) {
    };

    // HANDLERS
    // ========
    // For efficiency, a backend call is only made *once* to fetch the info of
    // an exploration's states. In order to maintain consistency, we attach
    // handlers to the state editor in order to make sure the data remains
    // fresh.

    StateAnswerStatisticsService.handleStateDelete = function(stateName) {
      // No action required, still useful in case we'd like to undo the state
      // deletion.
    };

    StateAnswerStatisticsService.handleStateAdd = function(stateName) {
      // Prepare an empty list of answer stats.
      this._cache[stateName] = [];
    };

    StateAnswerStatisticsService.handleStateAnswerGroupsUpdate =
      function(stateName) {
        // Each update to a state's answer group has the potentital to
        // completely change the answer. Thus, we simply rerun the computation
        // for the state in response.
        this.computeAddressedInfo(stateName);
      };

    StateAnswerStatisticsService.handleStateRename =
      function(oldStateName, newStateName) {
        // Simply change the name used to hold onto the answer stats.
        this._cache[newStateName] = this._cache[oldStateName];
        delete this._cache[oldStateName];
      };

    return StateAnswerStatisticsService;
  }]);
