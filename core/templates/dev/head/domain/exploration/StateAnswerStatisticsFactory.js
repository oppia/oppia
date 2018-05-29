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
 * @fileoverview Factory for creating new frontend instances of ParamType
 * domain objects.
 */

oppia.factory('StateAnswerStatisticsFactory', [
  '$http', '$injector', 'AngularNameService', 'AnswerClassificationService',
  'ExplorationContextService', 'ExplorationStatesService',
  function(
      $http, $injector, AngularNameService, AnswerClassificationService,
      ExplorationContextService, ExplorationStatesService) {
    /**
     * @private @constructor
     * @param {string} stateName
     * @param {*} answer
     * @param {number} frequency
     */
    var StateAnswerStatistics = function(stateName, answer, frequency) {
      /** @member {string} */
      this._stateName = stateName;
      /** @member {*} */
      this._answer = angular.copy(answer);
      /** @member {number} */
      this._frequency = frequency;
      /** @member {boolean} */
      this._isAddressed = true;

      this.updateIsAddressed();
    };

    StateAnswerStatistics.prototype.updateIsAddressed = function() {
      var explorationId = ExplorationContextService.getExplorationId();
      var state = ExplorationStatesService.getState(this._stateName);
      var interactionRulesService =
        AngularNameService.getNameOfInteractionRulesService(
          state.interaction.id);

      this._isAddressed =
        AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
          explorationId, this._stateName, state, this._answer,
          interactionRulesService);
    };

    /** @returns {*} */
    StateAnswerStatistics.prototype.getAnswer = function() {
      return angular.copy(this._answer);
    };

    /** @returns {number} */
    StateAnswerStatistics.prototype.getFrequency = function() {
      return this._frequency;
    };

    /** @returns {boolean} */
    StateAnswerStatistics.prototype.isAddressed = function() {
      return this._isAddressed;
    };

    /** @returns {{answer, frequency: number}} */
    StateAnswerStatistics.prototype.toBackendDict = function() {
      return {
        state_name: this._stateName,
        answer: angular.copy(this._answer),
        frequency: this._frequency,
      };
    };

    /**
     * @param {{state_name: string, answer, frequency: number}} backendDict
     * @returns {StateAnswerStatistics}
     */
    StateAnswerStatistics.createFromBackendDict = function(backendDict) {
      return new StateAnswerStatistics(
        backendDict.state_name, backendDict.answer, backendDict.frequency);
    };
  }
]);
