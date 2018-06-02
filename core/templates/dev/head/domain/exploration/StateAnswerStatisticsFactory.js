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
     * @private @constructor
     * @param {string} stateName
     * @param {Array.<{answer, frequency: number}>} topAnswers
     */
    var StateTopAnswerStatistics = function(stateName, topAnswers) {
      /** @member {string} */
      this._stateName = stateName;
      /** @member {*} */
      this._answers = angular.copy(topAnswers);

      this.updateIsAddressed();
    };

    StateTopAnswerStatistics.prototype.updateIsAddressed = function() {
      var explorationId = ExplorationContextService.getExplorationId();
      var state = ExplorationStatesService.getState(this._stateName);
      var interactionRulesService =
        AngularNameService.getNameOfInteractionRulesService(
          state.interaction.id);

      this._isAddressed =
        AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
          explorationId, this._stateName, state, this._answers,
          interactionRulesService);
    };

    /** @returns {*} */
    StateTopAnswerStatistics.prototype.getAnswer = function() {
      return angular.copy(this._answers);
    };

    /** @returns {number} */
    StateTopAnswerStatistics.prototype.getFrequency = function() {
      return this._frequency;
    };

    /** @returns {boolean} */
    StateTopAnswerStatistics.prototype.isAddressed = function() {
      return this._isAddressed;
    };

    /** @returns {{answer, frequency: number}} */
    StateTopAnswerStatistics.prototype.toBackendDict = function() {
      return {
        state_name: this._stateName,
        answer: angular.copy(this._answer),
        frequency: this._frequency,
      };
    };

    /**
     * @param {string} stateName - Name of the state this new instance will be
     *     responsible for.
     * @param {Array.<{answer, frequency: number}>} backendDict
     * @returns {StateTopAnswerStatistics}
     */
    StateTopAnswerStatistics.createFromBackendDict = function(
        stateName, backendArray) {
      return new StateTopAnswerStatistics(stateName, backendArray);
    };
  }
]);
