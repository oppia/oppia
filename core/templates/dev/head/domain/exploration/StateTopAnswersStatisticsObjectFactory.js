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
 * @fileoverview Factory for domain object which holds the list of top answer
 * statistics for a particular state.
 */

oppia.factory('StateTopAnswerStatisticsFactory', [
  '$http', '$injector', 'AngularNameService', 'AnswerClassificationService',
  'ExplorationContextService', 'ExplorationStatesService',
  function(
      $http, $injector, AngularNameService, AnswerClassificationService,
      ExplorationContextService, ExplorationStatesService) {
    /**
     * @typedef {Object} AnswerStatistics - A record for the statistics of a
     * single top answer.
     *
     * @property {*} answer - Contains the answer in its raw form, directly from
     *    the backend.
     * @property {string} answerHtml - Contains the answer as a string which can
     *    be rendered directly as HTML.
     * @property {number} frequency
     * @property {boolean} isAddressed
     */

    /**
     * TODO(brianrodri): Move this helper function into a proper service which
     * takes the state's interaction type into account when formatting the HTML.
     * @param {*} answer
     * @returns {string}
     */
    var convertAnswerToHtml = function(answer) {
      // Don't render quotes when the answer is a string.
      return (typeof answer === 'string') ? answer : angular.toJson(answer);
    };

    /**
     * @private @constructor
     * Returns a state's top answers with stale data. Needs to be refreshed by a
     * call to {@link StateTopAnswerStatistics#refreshIsAddressed} after
     * construction.
     *
     * @param {!string} stateName
     * @param {!{answer, frequency: number}[]} backendTopAnswers
     */
    var StateTopAnswerStatistics = function(stateName, backendTopAnswers) {
      /** @type {string} */
      this._stateName = stateName;
      /** @type {AnswerStatistics[]} */
      this._answers = backendTopAnswers.map(function(answerFrequencyPair) {
        return {
          answer: angular.copy(answerFrequencyPair.answer),
          answerHtml: convertAnswerToHtml(answerFrequencyPair.answer),
          frequency: answerFrequencyPair.frequency,
          isAddressed: false, // stale, needs to be updated.
        };
      });
    };

    /** Examines associated state to refresh the addressed info of answers. */
    StateTopAnswerStatistics.prototype.refreshIsAddressed = function() {
      var explorationId = ExplorationContextService.getExplorationId();
      var state = ExplorationStatesService.getState(this._stateName);
      var interactionRulesService = $injector.get(
        AngularNameService.getNameOfInteractionRulesService(
          state.interaction.id));

      this._answers.forEach(function(answerStats) {
        answerStats.isAddressed =
          AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
            explorationId, state.name, state, answerStats.answer,
            interactionRulesService);
      });
    };

    /** Returns rendering data for each answer and their statistics. */
    StateTopAnswerStatistics.prototype.getAnswerStats = function() {
      return this._answers.map(function(answerStats) {
        return {
          answer: answerStats.answerHtml,
          frequency: answerStats.frequency,
          isAddressed: answerStats.isAddressed,
        };
      });
    };

    /**
     * Prepares a fresh new StateTopAnswerStatistics instance from backend data.
     *
     * This is the prefered way to create new instances because it ensures the
     * data is fresh.
     *
     * @param {string} stateName - Name of the state this new instance will be
     *     responsible for.
     * @param {{answer, frequency: number}[]} backendDict
     * @returns {StateTopAnswerStatistics}
     */
    StateTopAnswerStatistics.createFromBackendDict = function(
        stateName, backendArray) {
      stateTopAnswerStatistics =
        new StateTopAnswerStatistics(stateName, backendArray);
      stateTopAnswerStatistics.refreshIsAddressed();
      return stateTopAnswerStatistics;
    };

    return StateTopAnswerStatistics;
  }
]);
