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
     * @property {*} answerRaw - Contains the answer in its raw form, directly
     *    from the backend.
     * @property {string} answerHtml - Contains the answer as a string which can
     *    be rendered directly as HTML.
     * @property {number} frequency
     * @property {boolean} isAddressed
     */

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
          answerRaw: angular.copy(answerFrequencyPair.answer),
          // TODO(brianrodri): Create a proper service to convert the raw
          // answers into HTML, because JSON.stringify will not always print a
          // "pretty" value.
          answerHtml: JSON.stringify(answerFrequencyPair.answer),
          frequency: answerFrequencyPair.frequency,
          isAddressed: false,
        };
      });
    };

    StateTopAnswerStatistics.prototype.updateIsAddressed = function() {
      var explorationId = ExplorationContextService.getExplorationId();
      var state = ExplorationStatesService.getState(this._stateName);
      var interactionRulesService =
        AngularNameService.getNameOfInteractionRulesService(
          state.interaction.id);

      this._answers.forEach(function(answerStats) {
        answerStats.isAddressed =
          AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
            explorationId, state.name, state, answerStats.answerRaw,
            interactionRulesService);
      });
    };

    StateTopAnswerStatistics.prototype.getAnswerStats = function() {
      return this._answers.map(function(answerStats) {
        return {
          answer: answerStats.answerHtml,
          frequency: answerStats.frequency,
          isAddressed: answerStats.isAddressed,
        };
      });
    };

    StateTopAnswerStatistics.prototype.toBackendDict = function() {
      return this._answers.map(function(answerStats) {
        return {
          answer: angular.copy(answerStats.answerRaw),
          frequency: answerStats.frequency,
        };
      });
    };

    /**
     * Prepares a new StateTopAnswerStatistics instance.
     * Use this function to build new instances, *not* the constructor!
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
