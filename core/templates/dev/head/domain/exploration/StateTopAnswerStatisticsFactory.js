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
 * @fileoverview TODO(brianrodri).
 */

oppia.factory('StateTopAnswerStatisticsFactory', [
  '$http', '$injector', 'AngularNameService', 'AnswerClassificationService',
  'ExplorationContextService', 'ExplorationStatesService',
  function(
      $http, $injector, AngularNameService, AnswerClassificationService,
      ExplorationContextService, ExplorationStatesService) {
    /**
     * @typedef {Object} AnswerStatistics
     * @property {*} answer - Contains the answer in its raw form, directly from
     *    the backend.
     * @property {string} answerAsHtml - Contains the answer as a string which
     *    can be rendered directly as HTML.
     * @property {number} frequency
     * @property {boolean} isAddressed
     */

    /** Converts input answer into an HTML representation.
     *
     * TODO(brianrodri): Create a proper service for this which takes
     * interactions into account.
     *
     * @param {*} answer
     * @returns {string}
     */
    var answerToHtml = function(answer) {
      if (typeof answer === "string") {
        return answer;
      } else {
        return JSON.toString(answer);
      }
    };

    /**
     * @private @constructor
     * Returns a state's top answers with stale data. For a fresh instance, use
     * @link StateTopAnswerStatistics#createFromBackendDict instead, or call the
     * update methods after construction.
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
          answerAsHtml: answerToHtml(answerFrequencyPair.answer),
          frequency: answerFrequencyPair.frequency,
          isAddressed: false,
        };
      });
    };

    /** Examines associated state to refresh the addressed info of answers. */
    StateTopAnswerStatistics.prototype.updateIsAddressed = function() {
      var explorationId = ExplorationContextService.getExplorationId();
      var state = ExplorationStatesService.getState(this._stateName);
      var interactionRulesService =
        AngularNameService.getNameOfInteractionRulesService(
          state.interaction.id);

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
          answer: answerStats.answerAsHtml,
          frequency: answerStats.frequency,
          isAddressed: answerStats.isAddressed,
        };
      });
    };

    /** Encodes a state's answers back into the backend form. */
    StateTopAnswerStatistics.prototype.toBackendDict = function() {
      return this._answers.map(function(answerStats) {
        return {
          answer: angular.copy(answerStats.answer),
          frequency: answerStats.frequency,
        };
      });
    };

    /**
     * Prepares a fresh new StateTopAnswerStatistics instance from backend data.
     *
     * This should be the prefered way to create new instances because it
     * ensures the data is fresh.
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
      stateTopAnswerStatistics.updateIsAddressed();
      return stateTopAnswerStatistics;
    };

    return StateTopAnswerStatistics;
  }
]);
